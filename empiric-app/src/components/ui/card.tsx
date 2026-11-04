import type { ComponentProps, ReactNode } from "react";

export function Card({ className = "", tone = "paper", ...props }: ComponentProps<"div"> & { tone?: "paper" | "vinho" | "accent" }) {
  const tones = {
    paper: "bg-paper ring-1 ring-black/[0.04]",
    vinho: "bg-vinho-gradient text-white",
    accent: "bg-paper ring-[1.5px] ring-bordo/80",
  };
  return <div className={`rounded-[var(--radius-card)] shadow-[var(--shadow-card)] ${tones[tone]} ${className}`} {...props} />;
}

export function CardHeader({ title, action, icon }: { title: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-6 pt-5 pb-3">
      <h2 className="heading flex items-center gap-2 text-[17px] font-semibold">
        {icon}
        {title}
      </h2>
      {action}
    </div>
  );
}
