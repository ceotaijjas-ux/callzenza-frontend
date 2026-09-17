import { HTMLAttributes } from "react";
import { clsx } from "clsx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={clsx(
        "rounded-[20px] border border-slate-100 bg-white/70 backdrop-blur-[18px] shadow-[0_4px_18px_rgba(16,19,42,0.06)] hover:shadow-[0_20px_50px_rgba(16,19,42,0.09)] transition-premium p-6 flex flex-col justify-between", 
        className
      )} 
      {...props} 
    />
  );
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={clsx("text-xs font-semibold tracking-wider text-slate-500 uppercase", className)} {...props} />;
}

export function CardValue({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={clsx("text-2xl font-bold tracking-tight mt-1.5 text-slate-900", className)} {...props} />;
}

