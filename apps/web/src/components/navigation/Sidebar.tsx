import React from "react";
import { Link, useLocation } from "react-router";
import { ChevronLeft, ChevronRight, LogOut, ShieldCheck } from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { usePermission } from "../../hooks/usePermission.js";
import { NAVIGATION_REGISTRY } from "../../config/navigation-registry.js";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar.js";
import { Button } from "../ui/button.js";

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({
  isCollapsed,
  onToggle,
  isMobileOpen,
  onMobileClose,
}: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { hasPermission } = usePermission();

  const filteredNav = NAVIGATION_REGISTRY.map((section) => ({
    group: section.group,
    items: section.items.filter(
      (item) => !item.permission || hasPermission(item.permission)
    ),
  })).filter((section) => section.items.length > 0);

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  const initials = user
    ? `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()
    : "";

  const sidebarClass = `
    fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card transition-all duration-150 lg:static
    ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
    ${isCollapsed ? "w-14" : "w-56"}
  `;

  return (
    <aside className={sidebarClass}>
      {/* Brand Header */}
      <div className="flex h-12 items-center justify-between border-b border-border px-3">
        <Link
          to="/dashboard"
          onClick={onMobileClose}
          className="flex items-center gap-2.5 font-bold focus:outline-none select-none min-w-0"
        >
          {/* Brand mark — typographic, not a colored square */}
          <span
            className="flex h-7 w-7 items-center justify-center rounded-xs border border-primary/40 bg-primary/8 text-primary"
            style={{ fontSize: "9px", fontWeight: 900, letterSpacing: "0.06em" }}
          >
            CC
          </span>
          {!isCollapsed && (
            <div className="flex flex-col leading-none">
              <span
                className="text-foreground font-black"
                style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                Campus
              </span>
              <span
                className="text-primary font-black"
                style={{ fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                Care
              </span>
            </div>
          )}
        </Link>
        <button
          onClick={onToggle}
          className="hidden rounded-sm p-1 hover:bg-muted text-muted-foreground hover:text-foreground lg:block focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="size-3.5" />
          ) : (
            <ChevronLeft className="size-3.5" />
          )}
        </button>
      </div>

      {/* Nav Navigation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {filteredNav.map((section) => (
          <div key={section.group} className="space-y-0.5">
            {!isCollapsed && (
              <h4 className="px-2 py-1 text-[9px] font-extrabold tracking-wider text-muted-foreground/80 uppercase select-none">
                {section.group}
              </h4>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      onClick={onMobileClose}
                      className={`flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-ring ${
                        active
                          ? "bg-primary/10 text-primary font-semibold border-l-2 border-primary -ml-0.5"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className="size-4 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* User Footer Card */}
      {user && (
        <div className="border-t border-border p-2.5 flex flex-col gap-2 bg-surface-subtle/50">
          <div className="flex items-center gap-2.5">
            <Avatar className="size-7 border border-border">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />}
              <AvatarFallback className="text-[10px] font-bold">{initials}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate leading-none">
                  {user.firstName} {user.lastName}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="size-3 text-primary" />
                  <span className="text-[10px] text-muted-foreground capitalize truncate">
                    {user.role}
                  </span>
                </div>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="outline"
              size="xs"
              onClick={logout}
              className="flex w-full items-center justify-center gap-1.5 text-destructive hover:bg-destructive/10 text-[11px] border-destructive/20"
            >
              <LogOut className="size-3" />
              Sign Out
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}
export default Sidebar;
