import { Outlet } from "react-router";
import { ThemeSwitch } from "../../components/navigation/ThemeSwitch.js";

/**
 * AuthLayout — CampusCare identity anchor.
 *
 * The auth surface uses a very subtle radial warm-tone overlay
 * to give the background depth without a decorative gradient.
 * The brand mark is typographic — not a colored icon square.
 */
export function AuthLayout() {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center p-4 overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Subtle background texture — two overlapping warm radials at very low opacity */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 50% at 30% 20%, oklch(62% 0.13 224 / 0.055) 0%, transparent 60%),
            radial-gradient(ellipse 60% 40% at 75% 80%, oklch(62% 0.13 224 / 0.035) 0%, transparent 60%)
          `,
        }}
      />

      {/* Theme toggle — top right */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeSwitch />
      </div>

      {/* Brand lockup — above the form card */}
      <div className="mb-6 flex flex-col items-center gap-1 select-none z-10">
        <div className="flex items-center gap-2.5">
          {/* Wordmark — typographic identity, not a colored square */}
          <span
            className="text-[10px] font-black tracking-[0.35em] uppercase text-primary"
            style={{ letterSpacing: "0.35em" }}
          >
            Campus
          </span>
          <span
            className="h-3.5 w-px"
            style={{ backgroundColor: "var(--border-strong)" }}
          />
          <span
            className="text-[10px] font-black tracking-[0.35em] uppercase text-foreground"
            style={{ letterSpacing: "0.35em" }}
          >
            Care
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground font-medium tracking-wider uppercase">
          IT Service Management
        </p>
      </div>

      {/* Form card */}
      <div
        className="relative z-10 w-full max-w-sm rounded-sm border border-border bg-card shadow-sm"
        style={{ padding: "1.75rem" }}
      >
        <Outlet />
      </div>

      <p className="mt-6 text-[10px] text-muted-foreground/50 select-none font-mono z-10">
        CampusCare Enterprise · v2.0
      </p>
    </div>
  );
}
export default AuthLayout;
