import { useState, useRef, useEffect } from "react";
import { LogOut, User, Settings, Shield } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { Link } from "react-router";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!user) return null;

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="User menu"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={`${user.firstName} ${user.lastName}`}
            className="size-8 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary border border-primary/20">
            {initials}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 origin-top-right rounded-md border border-border bg-card p-1 shadow-md ring-1 ring-black/5 focus:outline-none z-50 animate-in fade-in slide-in-from-top-1 duration-100"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="px-3 py-2 border-b border-border/60">
            <p className="text-sm font-semibold text-foreground">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            <span className="inline-flex mt-1 items-center rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary uppercase">
              {user.role.replace("_", " ")}
            </span>
          </div>

          <div className="py-1">
            <Link
              to="/profile"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-sm transition-colors"
              role="menuitem"
            >
              <User className="mr-2 size-4 text-muted-foreground" />
              My Profile
            </Link>
            <Link
              to="/settings"
              onClick={() => setIsOpen(false)}
              className="flex w-full items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-sm transition-colors"
              role="menuitem"
            >
              <Settings className="mr-2 size-4 text-muted-foreground" />
              Account Settings
            </Link>
            {user.role === "SYSTEM_ADMIN" && (
              <Link
                to="/audit"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center px-3 py-2 text-sm text-foreground hover:bg-accent rounded-sm transition-colors"
                role="menuitem"
              >
                <Shield className="mr-2 size-4 text-muted-foreground" />
                Audit Logs
              </Link>
            )}
          </div>

          <div className="border-t border-border/60 py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="flex w-full items-center px-3 py-2 text-sm text-destructive hover:bg-destructive/5 rounded-sm transition-colors"
              role="menuitem"
            >
              <LogOut className="mr-2 size-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
