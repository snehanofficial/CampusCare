import { Outlet } from "react-router";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4 md:p-8">
      <div className="w-full max-w-[420px] rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-primary">
            CampusCare
          </h1>
          <p className="text-sm text-muted-foreground">
            IT Service Management & Help Desk
          </p>
        </div>
        <div className="mt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
