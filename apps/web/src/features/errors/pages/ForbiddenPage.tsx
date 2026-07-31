import { Link } from "react-router";

export function ForbiddenPage() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-4">
      <p className="text-sm font-semibold text-destructive">403</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Access Denied
      </h1>
      <p className="mt-4 text-muted-foreground">
        You do not have the required permissions to access this page.
      </p>
      <div className="mt-6">
        <Link
          to="/dashboard"
          className="rounded-md border border-input bg-background px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
export default ForbiddenPage;
