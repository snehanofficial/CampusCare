import { Menu, Search } from "lucide-react";
import { Breadcrumb } from "./Breadcrumb.js";
import { NotificationBell } from "./NotificationBell.js";
import { ThemeSwitch } from "./ThemeSwitch.js";
import { UserMenu } from "./UserMenu.js";

interface NavbarProps {
  onMobileMenuToggle: () => void;
}

export function Navbar({ onMobileMenuToggle }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border/60 bg-background/95 px-4 backdrop-blur">
      {/* Left side: Hamburger (mobile) and Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuToggle}
          className="rounded p-1.5 hover:bg-accent text-muted-foreground hover:text-foreground lg:hidden focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Toggle navigation menu"
        >
          <Menu className="size-5" />
        </button>
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      {/* Right side: Global Search (scaffold), Notifications, Theme, User Menu */}
      <div className="flex items-center gap-4">
        {/* Search Input Scaffold */}
        <div className="relative hidden max-w-xs md:block">
          <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <input
            type="search"
            placeholder="Search... (Cmd+K)"
            className="h-9 w-48 rounded-md border border-input bg-muted/30 pl-9 pr-3 text-xs focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            disabled
          />
        </div>

        <div className="flex items-center gap-2">
          <NotificationBell />
          <ThemeSwitch />
        </div>

        <div className="h-6 w-px bg-border/60" />

        <UserMenu />
      </div>
    </header>
  );
}
