export function StepBar({ step, total = 3 }: { step: number; total?: number }) {
  return (
    <div className="flex gap-1.5 mb-4">
      {Array.from({ length: total }).map((_, i) => (
        <i
          key={i}
          className={`flex-1 h-1 rounded-full ${i < step ? "bg-accent" : "bg-black/10"}`}
        />
      ))}
    </div>
  );
}
