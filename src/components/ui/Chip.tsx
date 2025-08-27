"use client";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

export type ChipProps = {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "success" | "danger" | "info";
  size?: "sm" | "md";
  as?: "span" | "button" | "div";
  onClick?: React.MouseEventHandler<HTMLElement>;
  title?: string;
  ariaPressed?: boolean;
};

export default function Chip({
  children,
  className,
  variant = "default",
  size = "sm",
  as = "span",
  onClick,
  title,
  ariaPressed,
}: ChipProps) {
  const Comp: any = as;
  const base = "inline-flex items-center gap-1 rounded-full border select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500";
  const sizes = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";
  const variants = {
    default: "bg-black/10 dark:bg-white/10 border-transparent",
    outline: "bg-transparent border-black/20 dark:border-white/20",
    success: "bg-green-600 text-white border-green-600",
    danger: "bg-red-600 text-white border-red-600",
    info: "bg-blue-600 text-white border-blue-600",
  }[variant];
  const pressed = ariaPressed ? "ring-2 ring-blue-500" : "";
  return (
    <Comp
      className={twMerge(clsx(base, sizes, variants, pressed, className))}
      onClick={onClick as any}
      title={title}
      aria-pressed={ariaPressed}
    >
      {children}
    </Comp>
  );
}
