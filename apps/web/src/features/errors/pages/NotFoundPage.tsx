import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-4">
      <p className="text-sm font-semibold text-primary">404</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Page Not Found
      </h1>
      <p className="mt-4 text-muted-foreground">
        Sorry, we couldn't find the page you're looking for.
      </p>
      <div className="mt-6">
        <Link
          to="/dashboard"
          className="rounded-md bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          Go back home
        </Link>
      </div>
    </div>
  );
}
export default NotFoundPage;
