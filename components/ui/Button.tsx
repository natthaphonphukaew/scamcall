import type { ButtonHTMLAttributes } from "react";

/** outline = ใช้บนการ์ด surface-raised (neutral จะกลืนไปกับการ์ด) */
type Variant = "accept" | "danger" | "neutral" | "outline";

const VARIANTS: Record<Variant, string> = {
  accept: "bg-accept text-white",
  danger: "bg-danger text-white",
  neutral: "bg-surface-raised text-text",
  outline: "bg-surface text-text ring-1 ring-white/15",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** ปุ่มกลมใหญ่แบบปุ่มรับ/วางสาย */
  round?: boolean;
}

export function Button({ variant = "neutral", round = false, className = "", ...rest }: ButtonProps) {
  const shape = round
    ? "size-20 rounded-full text-sm"
    : "rounded-card px-5 py-3 text-base";
  return (
    <button
      type="button"
      className={`${VARIANTS[variant]} ${shape} font-medium transition active:scale-95 disabled:opacity-50 ${className}`}
      {...rest}
    />
  );
}
