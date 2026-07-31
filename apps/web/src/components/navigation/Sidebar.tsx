import { useState } from "react";
import { Link, useLocation, useMatch } from "react-router";
import {
  LayoutDashboard,
  Ticket,
  Monitor,
  Package,
  Wrench,
  BarChart2,
  Users,
  Building2,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  LogOut,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth.js";
import { usePermission } from "../../hooks/usePermission.js";

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

  const navItems = [
    {
      group: "Overview",
      items: [
        { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      ],
    },
    {
      group: "Support Operations",
      items: [
        {
          label: "My Tickets",
          href: "/tickets/mine",
          icon: Ticket,
          permission: "tickets:read_own",
        },
        {
          label: "All Tickets",
          href: "/tickets",
          icon: Ticket,
          permission: "tickets:read_all",
        },
      ],
    },
    {
      group: "Infrastructure",
      items: [
        {
          label: "Assets",
          href: "/assets",
          icon: Monitor,
          permission: "assets:read",
        },
        {
          label: "Inventory",
          href: "/inventory",
          icon: Package,
          permission: "inventory:read",
        },
      ],
    },
    {
      group: "Intelligence",
      items: [
        {
          label: "Reports",
          href: "/reports",
          icon: BarChart2,
          permission: "reports:view",
        },
        {
          label: "Knowledge Base",
          href: "/knowledge-base",
          icon: BookOpen,
        },
      ],
    },
    {
      group: "Administration",
      items: [
        {
          label: "Users",
          href: "/users",
          icon: Users,
          permission: "users:read",
        },
        {
          label: "Departments",
          href: "/departments",
          icon: Building2,
          permission: "departments:manage",
        },
        {
          label: "Audit Logs",
          href: "/audit",
          icon: Shield,
          permission: "audit:read",
        },
        {
          label: "Settings",
          href: "/settings",
          icon: Settings,
          permission: "settings:manage",
        },
      ],
    },
  ];

  const filteredNav = navItems
    .map((section) => ({
      group: section.group,
      items: section.items.filter(
        (item) => !item.permission || hasPermission(item.permission)
      ),
    }))
    .filter((section) => section.items.length > 0);

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
    ${isMobileOpen ? "translate-x-0" : "-translate-x-0 lg:translate-x-0"}
    ${isCollapsed ? "w-16" : "w-60"}
  `;

  return (
    <aside className={sidebarClass}>
      {/* Brand Header */}
      <div className="flex h-14 items-center justify-between border-b border-border/60 px-4">
        <Link
          to="/dashboard"
          onClick={onMobileClose}
          className="flex items-center gap-2 font-bold text-primary focus:outline-none"
        >
          <span className="flex size-8 items-center justify-center rounded bg-primary text-primary-foreground">
            CC
          </span>
          {!isCollapsed && <span className="text-foreground">CampusCare</span>}
        </Link>
        <button
          onClick={onToggle}
          className="hidden rounded p-1 hover:bg-accent text-muted-foreground hover:text-foreground lg:block focus:outline-none"
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
              <h4 className="px-2 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
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
                      className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors focus:outline-none ${
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

      {/* User Brief footer */}
      {user && (
        <div className="border-t border-border/60 p-3 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={`${user.firstName} ${user.lastName}`}
                className="size-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex size-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials}
              </div>
            )}
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {user.email}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-destructive hover:bg-destructive/5 font-medium transition-colors"
            >
              <LogOut className="size-3.5" />
              Sign Out
            </button>
          )}
        </div>
      )}
    </aside>
  );
}
