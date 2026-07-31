import React from "react";
import { cn } from "../../lib/utils.js";
import { Loader2 } from "lucide-react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "secondary" | "outline" | "ghost" | "link" | "destructive";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "md", type = "button", loading = false, disabled, children, ...props }, ref) => {
    const isPrimary = variant === "primary" || variant === "default";

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center rounded-sm font-semibold text-xs tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer border border-transparent",
          // Variants
          {
            "bg-primary text-primary-foreground hover:bg-primary-hover shadow-xs": isPrimary,
            "bg-secondary text-secondary-foreground hover:bg-secondary/80 border-border/60": variant === "secondary",
            "border-border bg-background hover:bg-muted text-foreground": variant === "outline",
            "hover:bg-muted text-muted-foreground hover:text-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline bg-transparent": variant === "link",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-xs": variant === "destructive",
          },
          // Sizes
          {
            "h-7 px-2.5 text-[11px]": size === "xs",
            "h-8 px-3 text-xs": size === "sm",
            "h-9 px-4 text-xs": size === "md",
            "h-10 px-5 text-sm": size === "lg",
            "h-8 w-8 p-0": size === "icon",
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="size-3.5 animate-spin mr-1.5" />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
