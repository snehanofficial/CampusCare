import { cn } from "../../lib/utils.js";

export function LoadingSpinner({ className, size = "md", ...props }: { className?: string; size?: "sm" | "md" | "lg" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        "animate-spin text-primary",
        {
          "size-4": size === "sm",
          "size-6": size === "md",
          "size-8": size === "lg",
        },
        className
      )}
      {...props}
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
