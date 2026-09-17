import { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "kakao";

const base =
  "block w-full text-center font-bold text-[15.5px] py-3.5 px-4 rounded-2xl border-2 border-transparent transition active:scale-[0.98] active:border-ink focus-visible:border-ink disabled:cursor-not-allowed";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-paper-card disabled:bg-[#DCD0B6] disabled:text-[#A99C82]",
  ghost: "bg-white text-ink border-black/10",
  kakao: "bg-[#FEE500] text-[#391B1B]",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  small?: boolean;
}

export function Button({ variant = "primary", small, className = "", ...rest }: Props) {
  return (
    <button
      className={`${base} ${variants[variant]} ${
        small ? "w-auto py-2.5 px-4 text-[13px] rounded-xl" : ""
      } ${className}`}
      {...rest}
    />
  );
}
