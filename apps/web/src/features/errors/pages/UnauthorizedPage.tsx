import { Link } from "react-router";
import { KeyRound } from "lucide-react";

export function UnauthorizedPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6 bg-background">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary mb-4 border border-primary/20">
        <KeyRound className="size-6" />
      </div>
      <p className="text-[10px] font-bold tracking-widest text-primary uppercase">401 — Unauthorized</p>
      <h1 className="mt-2 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
        Authentication Required
      </h1>
      <p className="mt-3 text-xs text-muted-foreground max-w-sm leading-relaxed">
        Your active session has expired or you are not logged in. Please sign in to access this area.
      </p>
      <div className="mt-6">
        <Link
          to="/login"
          className="inline-flex items-center justify-center rounded-md font-semibold text-xs h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors select-none"
        >
          Sign In Credentials
        </Link>
      </div>
    </div>
  );
}
export default UnauthorizedPage;
