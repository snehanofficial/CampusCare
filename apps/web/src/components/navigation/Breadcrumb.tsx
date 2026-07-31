import { Link, useLocation } from "react-router";
import { ChevronRight, Home } from "lucide-react";

export function Breadcrumb() {
  const location = useLocation();
  const pathnames = location.pathname.split("/").filter((x) => x);

  const formatSegment = (segment: string) => {
    // If it's a UUID/ID, show a generic ID identifier or ellipsis
    const isId = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(segment);
    if (isId) {
      return "Detail";
    }
    return segment
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm text-muted-foreground">
        <li>
          <Link
            to="/dashboard"
            className="flex items-center hover:text-foreground transition-colors"
          >
            <Home className="size-4" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {pathnames.map((value, index) => {
          const last = index === pathnames.length - 1;
          const to = `/${pathnames.slice(0, index + 1).join("/")}`;

          // Don't link to the actual list page if we're on it, or if it is the current page
          return (
            <li key={to} className="flex items-center">
              <ChevronRight className="size-4 mx-1 flex-shrink-0 text-muted-foreground/60" />
              {last ? (
                <span className="font-semibold text-foreground" aria-current="page">
                  {formatSegment(value)}
                </span>
              ) : (
                <Link
                  to={to}
                  className="hover:text-foreground transition-colors"
                >
                  {formatSegment(value)}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
