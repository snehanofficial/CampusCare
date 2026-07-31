import { useRouteError, isRouteErrorResponse, Link } from "react-router";

export function RouteErrorBoundary() {
  const error = useRouteError();
  console.error("Route Error Boundary caught:", error);

  let statusCode = 500;
  let title = "Unexpected Error";
  let message = "An unexpected error occurred. Please try again later.";

  if (isRouteErrorResponse(error)) {
    statusCode = error.status;
    title = error.statusText || `${error.status} Error`;
    message = error.data?.message || "Something went wrong while loading this page.";
  } else if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center bg-background p-4 text-foreground">
      <div className="w-full max-w-md text-center">
        <p className="text-sm font-semibold text-primary">{statusCode}</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {title}
        </h1>
        <p className="mt-4 text-muted-foreground">{message}</p>
        <div className="mt-6 flex items-center justify-center gap-x-3">
          <Link
            to="/dashboard"
            className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            Go to Dashboard
          </Link>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md border border-input bg-background px-3.5 py-2.5 text-sm font-semibold text-foreground shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
export default RouteErrorBoundary;
