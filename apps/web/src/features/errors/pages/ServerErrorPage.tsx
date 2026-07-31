import { Link } from "react-router";
import { ShieldAlert } from "lucide-react";

export function ServerErrorPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6 bg-background">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4 border border-destructive/20">
        <ShieldAlert className="size-6" />
      </div>
      <p className="text-[10px] font-bold tracking-widest text-destructive uppercase">500 — Server Error</p>
      <h1 className="mt-2 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
        Internal Server Error
      </h1>
      <p className="mt-3 text-xs text-muted-foreground max-w-sm leading-relaxed">
        Something went wrong on our servers. We have logged this error and are working on fixing it.
      </p>
      <div className="mt-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center rounded-md font-semibold text-xs h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors select-none"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
export default ServerErrorPage;
