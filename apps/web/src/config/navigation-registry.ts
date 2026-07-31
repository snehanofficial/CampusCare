import {
  LayoutDashboard,
  Ticket,
  Monitor,
  Package,
  BarChart2,
  Users,
  Building2,
  Shield,
  Settings,
  BookOpen,
  FlaskConical,
  User,
  KeyRound,
  type LucideIcon,
} from "lucide-react";
import type { PermissionCode } from "@campuscare/constants";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: PermissionCode;
  featureFlag?: string;
}

export interface NavigationSection {
  group: string;
  items: NavigationItem[];
}

export const NAVIGATION_REGISTRY: readonly NavigationSection[] = [
  {
    group: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "UI Lab / Playground", href: "/playground", icon: FlaskConical },
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
  {
    group: "Account",
    items: [
      {
        label: "Profile Settings",
        href: "/profile",
        icon: User,
      },
      {
        label: "Active Sessions",
        href: "/profile/sessions",
        icon: KeyRound,
      },
    ],
  },
] as const;
