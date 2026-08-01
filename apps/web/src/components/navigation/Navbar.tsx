import { Menu, Search } from "lucide-react";
import { Breadcrumb } from "./Breadcrumb.js";
import { NotificationBell } from "./NotificationBell.js";
import { ThemeSwitch } from "./ThemeSwitch.js";
import { DensitySwitch } from "./DensitySwitch.js";
import { UserMenu } from "./UserMenu.js";
import { TemporaryAccessIndicator } from "../../features/privileges/components/TemporaryAccessIndicator.js";

interface NavbarProps {
  onMobileMenuToggle: () => void;
}

export function Navbar({ onMobileMenuToggle }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-12 w-full items-center justify-between border-b border-border bg-card/95 px-4 backdrop-blur-xs">
      {/* Left side: Hamburger (mobile) and Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="rounded-sm p-1 hover:bg-muted text-muted-foreground hover:text-foreground lg:hidden focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Toggle navigation menu"
        >
          <Menu className="size-4" />
        </button>
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right side: Global Search, Density, Notifications, Theme, User Menu */}
      <div className="flex items-center gap-3">
        {/* Quick Command Palette Search Button */}
        <button
          onClick={() => window.dispatchEvent(new Event("palette:open"))}
          className="relative hidden md:flex items-center justify-between text-left text-muted-foreground hover:text-foreground h-7 w-52 rounded-sm border border-input bg-muted/20 px-2.5 text-xs transition-colors select-none cursor-pointer focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <div className="flex items-center gap-2">
            <Search className="size-3.5 text-muted-foreground" />
            <span className="text-[11px]">Quick Search...</span>
          </div>
          <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-0.5 rounded border border-border bg-muted px-1 text-[9px] font-mono font-bold text-muted-foreground">
            <span className="text-[10px]">⌘</span>K
          </kbd>
        </button>

        <div className="flex items-center gap-2">
          <TemporaryAccessIndicator />
          <DensitySwitch />
          <NotificationBell />
          <ThemeSwitch />
        </div>

        <div className="h-5 w-px bg-border/60" />

        <UserMenu />
      </div>
    </header>
  );
}
export default Navbar;
