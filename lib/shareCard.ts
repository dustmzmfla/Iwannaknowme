// 받은 답변을 한 장의 이미지로 저장하기 위한 유틸입니다.
// 외부 라이브러리(html-to-image 등) 없이 브라우저 내장 Canvas 2D API만 사용합니다.
// 맨 위에는 앱 아이콘 + 워드마크, 그 아래에는 질문지 하나를 "카카오톡 대화창"처럼
// 표현합니다 — 질문(Q)은 왼쪽 말풍선에 빨간 글씨, 답변은 오른쪽 말풍선에 검정 글씨로.

export interface ShareCardData {
  isAnonymous: boolean;
  nickname: string;
  qa: { question: string; answer: string }[];
  finalMessage: string;
}

const CARD_W = 1080;
const OUTER_PAD = 70; // 대화창 좌우 여백
const SCALE = 2; // 더 또렷한 PNG를 위한 내부 렌더 배율
const ICON_SRC = "/share-icon.png";

const COLORS = {
  bgTop: "#F5EFE6",
  bgMid: "#EFE7DA",
  bgBot: "#EAE1D2",
  windowBg: "#F7F3EA",
  headerBg: "#FBF4E4",
  bubbleQuestion: "#FFFFFF",
  bubbleAnswer: "#FFD37A", // 카카오톡 말풍선과 비슷한 골드/옐로우
  ink: "#1F1B16", // 답변 텍스트(검정에 가깝게)
  inkSoft: "#7A6B58",
  accent: "#B23A2E", // 질문(Q) 텍스트 — 현재 테마의 포인트 레드
  border: "rgba(0,0,0,0.06)",
};

function cssVar(name: string): string {
  if (typeof window === "undefined" || typeof document === "undefined") return "sans-serif";
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || "sans-serif";
}

// next/font가 <html>에 심어둔 CSS 변수에서 실제 폰트 패밀리 이름을 읽어옵니다.
function fonts() {
  return {
    noto: cssVar("--font-noto"),
    blackHan: cssVar("--font-black-han"),
  };
}

async function ensureFontsReady() {
  if (typeof document === "undefined") return;
  try {
    await document.fonts.ready;
  } catch {
    // 일부 브라우저는 document.fonts.ready 를 지원하지 않을 수 있어 무시합니다.
  }
  const { noto, blackHan } = fonts();
  const specs = [
    `700 26px ${noto}`,
    `800 22px ${noto}`,
    `700 20px ${noto}`,
    `400 40px ${blackHan}`,
  ];
  try {
    await Promise.all(specs.map((s) => document.fonts.load(s)));
  } catch {
    // 폰트 프리로드 실패는 무시하고 시스템 대체 폰트로 진행합니다.
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지를 불러오지 못했습니다: ${src}`));
    img.src = src;
  });
}

// 긴 단어(공백 없는 한글 등)도 처리하는 줄바꿈 헬퍼입니다.
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const paragraphs = text.split("\n");
  const lines: string[] = [];

  const breakLongWord = (word: string): string[] => {
    const out: string[] = [];
    let chunk = "";
    for (const ch of word) {
      const test = chunk + ch;
      if (chunk && ctx.measureText(test).width > maxWidth) {
        out.push(chunk);
        chunk = ch;
      } else {
        chunk = test;
      }
    }
    if (chunk) out.push(chunk);
    return out;
  };

  for (const para of paragraphs) {
    if (para.trim() === "") {
      lines.push("");
      continue;
    }
    const words = para.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        current = candidate;
        continue;
      }
      if (current) {
        lines.push(current);
        current = "";
      }
      if (ctx.measureText(word).width > maxWidth) {
        const parts = breakLongWord(word);
        lines.push(...parts.slice(0, -1));
        current = parts[parts.length - 1] ?? "";
      } else {
        current = word;
      }
    }
    if (current) lines.push(current);
  }
  return lines.length ? lines : [""];
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radii: { tl: number; tr: number; br: number; bl: number }
) {
  const tl = Math.min(radii.tl, w / 2, h / 2);
  const tr = Math.min(radii.tr, w / 2, h / 2);
  const br = Math.min(radii.br, w / 2, h / 2);
  const bl = Math.min(radii.bl, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}

// ---- 말풍선 크기 계산 ----
const BUBBLE_FONT_SIZE = 26;
const BUBBLE_LINE_H = 36;
const BUBBLE_PAD_X = 22;
const BUBBLE_PAD_Y = 16;
const BUBBLE_MIN_W = 100;

interface BubbleMetrics {
  lines: string[];
  width: number;
  height: number;
}

function measureBubble(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxContentWidth: number,
  fontSpec: string
): BubbleMetrics {
  ctx.font = fontSpec;
  const lines = wrapText(ctx, text, maxContentWidth - BUBBLE_PAD_X * 2);
  let maxLineWidth = 0;
  for (const line of lines) {
    const w = ctx.measureText(line).width;
    if (w > maxLineWidth) maxLineWidth = w;
  }
  const width = Math.max(BUBBLE_MIN_W, Math.ceil(maxLineWidth) + BUBBLE_PAD_X * 2);
  const height = lines.length * BUBBLE_LINE_H + BUBBLE_PAD_Y * 2;
  return { lines, width, height };
}

function drawBubble(
  ctx: CanvasRenderingContext2D,
  metrics: BubbleMetrics,
  side: "left" | "right",
  windowX: number,
  windowWidth: number,
  y: number,
  bg: string,
  textColor: string,
  fontSpec: string
) {
  const x = side === "left" ? windowX + BUBBLE_PAD_X : windowX + windowWidth - BUBBLE_PAD_X - metrics.width;
  const radii =
    side === "left"
      ? { tl: 20, tr: 20, br: 20, bl: 4 }
      : { tl: 20, tr: 20, br: 4, bl: 20 };

  ctx.save();
  ctx.shadowColor = "rgba(63,45,30,0.10)";
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = bg;
  roundRectPath(ctx, x, y, metrics.width, metrics.height, radii);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.font = fontSpec;
  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let textY = y + BUBBLE_PAD_Y + 26;
  for (const line of metrics.lines) {
    ctx.fillText(line, x + BUBBLE_PAD_X, textY);
    textY += BUBBLE_LINE_H;
  }
  ctx.restore();
}

interface QaRow {
  question: BubbleMetrics;
  answer: BubbleMetrics;
}

interface Layout {
  totalWidth: number;
  totalHeight: number;
  iconY: number;
  iconSize: number;
  wordmarkY: number;
  windowX: number;
  windowY: number;
  windowWidth: number;
  windowHeight: number;
  headerHeight: number;
  rows: { row: QaRow; qY: number; aY: number }[];
  finalBubble: { metrics: BubbleMetrics; y: number } | null;
  footerY: number;
}

const TOP_MARGIN = 56;
const ICON_SIZE = 116;
const ICON_GAP = 16;
const WORDMARK_H = 58;
const WORDMARK_GAP = 36;
const HEADER_H = 76;
const MSG_PAD_TOP = 30;
const MSG_PAD_BOTTOM = 30;
const BUBBLE_GAP = 14; // 질문 → 답변 사이
const ROW_GAP = 26; // 한 질문/답변 쌍 → 다음 쌍
const BOTTOM_MARGIN = 74;

function buildLayout(
  mctx: CanvasRenderingContext2D,
  data: ShareCardData
): Layout {
  const { noto } = fonts();
  const windowX = OUTER_PAD;
  const windowWidth = CARD_W - OUTER_PAD * 2;
  const maxBubbleContentWidth = windowWidth * 0.72;

  const qFont = `800 ${BUBBLE_FONT_SIZE}px ${noto}, sans-serif`;
  const aFont = `800 ${BUBBLE_FONT_SIZE}px ${noto}, sans-serif`;

  let cursor = HEADER_H + MSG_PAD_TOP;
  const rows: { row: QaRow; qY: number; aY: number }[] = [];

  data.qa.forEach((qa, i) => {
    const question = measureBubble(mctx, `Q. ${qa.question}`, maxBubbleContentWidth, qFont);
    const qY = cursor;
    cursor += question.height + BUBBLE_GAP;

    const answer = measureBubble(mctx, qa.answer, maxBubbleContentWidth, aFont);
    const aY = cursor;
    cursor += answer.height;

    rows.push({ row: { question, answer }, qY, aY });
    cursor += i < data.qa.length - 1 ? ROW_GAP : 0;
  });

  let finalBubble: { metrics: BubbleMetrics; y: number } | null = null;
  if (data.finalMessage && data.finalMessage.trim()) {
    cursor += ROW_GAP;
    const metrics = measureBubble(mctx, `💌 ${data.finalMessage}`, maxBubbleContentWidth, aFont);
    finalBubble = { metrics, y: cursor };
    cursor += metrics.height;
  }

  cursor += MSG_PAD_BOTTOM;
  const windowHeight = cursor;
  const windowY = TOP_MARGIN + ICON_SIZE + ICON_GAP + WORDMARK_H + WORDMARK_GAP;
  const totalHeight = windowY + windowHeight + BOTTOM_MARGIN;

  return {
    totalWidth: CARD_W,
    totalHeight,
    iconY: TOP_MARGIN,
    iconSize: ICON_SIZE,
    wordmarkY: TOP_MARGIN + ICON_SIZE + ICON_GAP,
    windowX,
    windowY,
    windowWidth,
    windowHeight,
    headerHeight: HEADER_H,
    rows,
    finalBubble,
    footerY: windowY + windowHeight + BOTTOM_MARGIN / 2,
  };
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const grad = ctx.createLinearGradient(0, 0, w * 0.3, h);
  grad.addColorStop(0, COLORS.bgTop);
  grad.addColorStop(0.55, COLORS.bgMid);
  grad.addColorStop(1, COLORS.bgBot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function drawWordmark(ctx: CanvasRenderingContext2D, w: number, y: number) {
  const { blackHan } = fonts();
  ctx.save();
  ctx.font = `400 40px ${blackHan}, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = COLORS.ink;
  ctx.fillText("내가 누구게?", w / 2, y + WORDMARK_H / 2);
  ctx.restore();
}

function drawChatHeader(
  ctx: CanvasRenderingContext2D,
  layout: Layout,
  data: ShareCardData
) {
  const { noto } = fonts();
  const { windowX, windowY, windowWidth, headerHeight } = layout;

  ctx.save();
  ctx.fillStyle = COLORS.headerBg;
  roundRectPath(ctx, windowX, windowY, windowWidth, headerHeight, { tl: 26, tr: 26, br: 0, bl: 0 });
  ctx.fill();
  ctx.strokeStyle = COLORS.border;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(windowX, windowY + headerHeight - 0.5);
  ctx.lineTo(windowX + windowWidth, windowY + headerHeight - 0.5);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = `800 24px ${noto}, sans-serif`;
  ctx.fillStyle = COLORS.ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const label = data.isAnonymous || !data.nickname ? "익명" : data.nickname;
  ctx.fillText(label, windowX + windowWidth / 2, windowY + headerHeight / 2);
  ctx.restore();
}

function drawFooter(ctx: CanvasRenderingContext2D, w: number, y: number) {
  const { noto } = fonts();
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 18px ${noto}, sans-serif`;
  ctx.fillStyle = "#9A8B77";
  ctx.fillText("내가 누구게? · 친구들에게 질문을 만들어 보내는 익명 질문지", w / 2, y);
  ctx.restore();
}

export async function generateShareCardPng(data: ShareCardData): Promise<Blob> {
  await ensureFontsReady();
  const iconImg = await loadImage(ICON_SRC).catch(() => null);

  const measureCanvas = document.createElement("canvas");
  const mctx = measureCanvas.getContext("2d");
  if (!mctx) throw new Error("Canvas 2D를 지원하지 않는 브라우저입니다.");

  const layout = buildLayout(mctx, data);

  const canvas = document.createElement("canvas");
  canvas.width = layout.totalWidth * SCALE;
  canvas.height = layout.totalHeight * SCALE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D를 지원하지 않는 브라우저입니다.");
  ctx.scale(SCALE, SCALE);

  drawBackground(ctx, layout.totalWidth, layout.totalHeight);

  // 앱 아이콘
  if (iconImg) {
    ctx.save();
    ctx.shadowColor = "rgba(63,45,30,0.22)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;
    const ix = layout.totalWidth / 2 - layout.iconSize / 2;
    ctx.drawImage(iconImg, ix, layout.iconY, layout.iconSize, layout.iconSize);
    ctx.restore();
  }

  drawWordmark(ctx, layout.totalWidth, layout.wordmarkY);

  // 대화창 배경 + 그림자
  ctx.save();
  ctx.shadowColor = "rgba(63,45,30,0.20)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 14;
  ctx.fillStyle = COLORS.windowBg;
  roundRectPath(ctx, layout.windowX, layout.windowY, layout.windowWidth, layout.windowHeight, {
    tl: 26,
    tr: 26,
    br: 26,
    bl: 26,
  });
  ctx.fill();
  ctx.restore();

  drawChatHeader(ctx, layout, data);

  const qFont = `800 ${BUBBLE_FONT_SIZE}px ${fonts().noto}, sans-serif`;
  const aFont = `800 ${BUBBLE_FONT_SIZE}px ${fonts().noto}, sans-serif`;

  for (const { row, qY, aY } of layout.rows) {
    drawBubble(
      ctx,
      row.question,
      "left",
      layout.windowX,
      layout.windowWidth,
      layout.windowY + qY,
      COLORS.bubbleQuestion,
      COLORS.accent,
      qFont
    );
    drawBubble(
      ctx,
      row.answer,
      "right",
      layout.windowX,
      layout.windowWidth,
      layout.windowY + aY,
      COLORS.bubbleAnswer,
      COLORS.ink,
      aFont
    );
  }

  if (layout.finalBubble) {
    drawBubble(
      ctx,
      layout.finalBubble.metrics,
      "right",
      layout.windowX,
      layout.windowWidth,
      layout.windowY + layout.finalBubble.y,
      COLORS.bubbleAnswer,
      COLORS.ink,
      aFont
    );
  }

  drawFooter(ctx, layout.totalWidth, layout.footerY);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("이미지를 만들지 못했습니다."));
    }, "image/png");
  });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
