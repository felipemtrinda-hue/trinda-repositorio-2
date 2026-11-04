import Link from "next/link";
import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-[background,color,transform] duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none";
const variants: Record<Variant, string> = {
  primary: "bg-bordo text-white hover:bg-bordo-hover",
  secondary: "bg-paper text-charcoal border border-cream hover:border-rose-line hover:bg-rose-mist/50",
  ghost: "text-graphite hover:bg-rose-mist/60",
  danger: "bg-danger text-white hover:opacity-90",
};
const sizes = { sm: "h-9 px-4 text-sm", md: "h-11 px-6 text-[15px]", lg: "h-12 px-7 text-base" };

export function buttonClass(variant: Variant = "primary", size: keyof typeof sizes = "md", extra = "") {
  return `${base} ${variants[variant]} ${sizes[size]} ${extra}`;
}

export function Button({
  variant = "primary", size = "md", className = "", ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <button className={buttonClass(variant, size, className)} {...props} />;
}

export function ButtonLink({
  variant = "primary", size = "md", className = "", ...props
}: ComponentProps<typeof Link> & { variant?: Variant; size?: keyof typeof sizes }) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}
