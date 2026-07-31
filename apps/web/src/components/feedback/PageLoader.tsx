import { Loader2 } from "lucide-react";

export function PageLoader() {
  return (
    <div className="flex h-full min-h-[400px] w-full items-center justify-center">
      <div className="flex flex-col items-center space-y-2 text-center">
        <Loader2 className="size-8 animate-spin text-primary" />
        <p className="text-xs font-medium text-muted-foreground animate-pulse">
          Loading CampusCare...
        </p>
      </div>
    </div>
  );
}
export default PageLoader;
