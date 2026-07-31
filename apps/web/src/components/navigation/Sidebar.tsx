import React from "react";
import { Link, useLocation } from "react-router";
import { ChevronLeft, ChevronRight, LogOut } from "lucide-react";
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
    fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-card transition-all duration-200 lg:static
    ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
    ${isCollapsed ? "w-16" : "w-60"}
  `;

  return (
    <aside className={sidebarClass}>
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-border/40 px-4">
        <Link
          to="/dashboard"
          onClick={onMobileClose}
          className="flex items-center gap-2 font-bold text-primary focus:outline-none select-none"
        >
          <span className="flex size-8 items-center justify-center rounded bg-primary text-primary-foreground font-black text-sm">
            CC
          </span>
          {!isCollapsed && <span className="text-foreground text-sm tracking-tight font-extrabold">CampusCare</span>}
        </Link>
        <button
          onClick={onToggle}
          className="hidden rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground lg:block focus:outline-none cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="size-4" />
          ) : (
            <ChevronLeft className="size-4" />
          )}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {filteredNav.map((section) => (
          <div key={section.group} className="space-y-1">
            {!isCollapsed && (
              <h4 className="px-2.5 text-[9px] font-bold tracking-wider text-muted-foreground uppercase select-none">
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
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-xs font-semibold transition-colors focus:outline-none ${
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      }`}
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className="size-4 flex-shrink-0" />
                      {!isCollapsed && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* User Brief Footer */}
      {user && (
        <div className="border-t border-border/40 p-3 flex flex-col gap-2 bg-muted/10">
          <div className="flex items-center gap-3">
            <Avatar className="size-8 border border-border">
              {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={`${user.firstName} ${user.lastName}`} />}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-foreground truncate leading-normal">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] text-muted-foreground truncate leading-normal">
                  {user.email}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="flex w-full items-center gap-2 text-destructive hover:bg-destructive/5 font-semibold text-xs border-destructive/20 hover:border-destructive/40"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </Button>
          )}
        </div>
      )}
    </aside>
  );
}
export default Sidebar;
