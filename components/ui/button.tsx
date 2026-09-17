import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "link" | "secondary";
  size?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        suppressHydrationWarning
        className={clsx(
          "inline-flex items-center justify-center text-sm font-semibold tracking-wide transition-premium disabled:opacity-50 disabled:pointer-events-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20",
          variant === "default" && "bg-gradient-to-br from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30 hover:shadow-lg hover:shadow-indigo-600/40 hover:-translate-y-0.5",
          variant === "outline" && "border-2 border-slate-200 bg-white hover:border-indigo-600 hover:-translate-y-0.5 text-slate-700 hover:text-indigo-600",
          variant === "ghost" && "hover:bg-slate-50 text-slate-600 hover:text-slate-900",
          variant === "destructive" && "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/10",
          variant === "secondary" && "bg-slate-100 text-slate-800 hover:bg-slate-200 hover:-translate-y-0.5",
          variant === "link" && "text-primary underline-offset-4 hover:underline",
          size === "sm" && "h-8 px-3.5 text-xs rounded-[10px]",
          size === "lg" && "h-12 px-7 rounded-[14px] text-base",
          size === "icon" && "h-9 w-9 p-0 rounded-xl",
          !size && "h-[48px] px-[28px] rounded-[12px] text-[0.95rem]",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

