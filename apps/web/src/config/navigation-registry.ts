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
  Activity,
  Bell,
  AlertCircle,
  Wrench,
  FolderTree,
  TrendingUp,
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
      { label: "Service Status", href: "/service-status", icon: Activity },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "UI Lab / Playground", href: "/playground", icon: FlaskConical, permission: "settings:manage" },
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
      {
        label: "Incidents",
        href: "/incidents",
        icon: AlertCircle,
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
        label: "Maintenance",
        href: "/maintenance",
        icon: Wrench,
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
        label: "Analytics",
        href: "/analytics",
        icon: TrendingUp,
        permission: "reports:view",
      },
      {
        label: "SLA Policies",
        href: "/sla",
        icon: Shield,
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
        label: "Categories",
        href: "/categories",
        icon: FolderTree,
        permission: "categories:manage",
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
