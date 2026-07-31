# APP_SHELL.md
## CampusCare — Application Shell Architecture

> **Status:** Phase 1 Implementation Reference  
> **Stack:** React 19 · React Router v8 · Tailwind CSS v4 · Lucide Icons  
> **Breakpoints:** Mobile-first (md: 768px, lg: 1024px)

---

## 1. Purpose

This document defines the Application Shell — the persistent outer wrapper of the CampusCare UI. The shell is the frame into which all business module pages are rendered. It includes the Sidebar, Navbar, Breadcrumb, User Menu, Notification Bell, Theme Switch, and Footer.

The shell contains **no business logic**. It is purely structural and navigational.

---

## 2. Shell Architecture

```
App
└── AppLayout (shell)
    ├── Sidebar (persistent left nav, collapsible)
    │   ├── Logo
    │   ├── NavItems (filtered by permissions)
    │   ├── CollapseToggle
    │   └── UserBrief (bottom: avatar + name + role)
    │
    ├── MainArea (flex-col, fills remaining width)
    │   ├── Navbar (top bar, sticky)
    │   │   ├── BreadcrumbArea (left)
    │   │   ├── GlobalSearch (center, Cmd+K)
    │   │   ├── NotificationBell (right)
    │   │   ├── ThemeSwitch (right)
    │   │   └── UserMenu (right, avatar dropdown)
    │   │
    │   ├── PageContent (scrollable, flex-1)
    │   │   └── <Outlet /> (child route renders here)
    │   │
    │   └── Footer (minimal, sticky bottom)
    │
    └── MobileOverlay (sidebar backdrop on mobile)
```

---

## 3. Layout Behavior by Breakpoint

| Breakpoint | Sidebar | Navbar | Content |
|:---|:---|:---|:---|
| Mobile (< 768px) | Hidden, slides in via hamburger | Visible, compact | Full-width, scrollable |
| Tablet (768px–1023px) | Icon-only collapsed (48px wide) | Visible, standard | Fills remaining space |
| Desktop (≥ 1024px) | Expanded (240px wide) or icon-only (64px) | Visible, full | Fills remaining space |

**State:** Sidebar collapse is a user preference stored in `localStorage` and managed by `useLocalStorage` hook.

---

## 4. Component Directory Structure

```
apps/web/src/
├── app/
│   ├── layouts/
│   │   ├── AppLayout.tsx          # Shell wrapper (Sidebar + Navbar + Outlet)
│   │   ├── AuthLayout.tsx         # Centered card layout (Login page)
│   │   └── PublicLayout.tsx       # Minimal layout for public pages
│   │
│   ├── router/
│   │   ├── router.tsx             # createBrowserRouter definition
│   │   └── routes.tsx             # Route definitions + lazy imports
│   │
│   └── guards/
│       ├── ProtectedRoute.tsx     # Auth check guard
│       ├── PermissionGuard.tsx    # Permission check guard
│       └── PublicOnlyRoute.tsx    # Redirect if already authenticated
│
├── components/
│   └── navigation/
│       ├── Sidebar.tsx            # Main sidebar component
│       ├── SidebarItem.tsx        # Individual nav link
│       ├── SidebarGroup.tsx       # Grouped nav section
│       ├── Navbar.tsx             # Top navbar
│       ├── Breadcrumb.tsx         # Breadcrumb trail
│       ├── UserMenu.tsx           # Avatar + dropdown
│       ├── NotificationBell.tsx   # Bell + badge
│       ├── ThemeSwitch.tsx        # Light/Dark/System toggle
│       └── MobileMenuButton.tsx   # Hamburger for mobile
```

---

## 5. Sidebar Component Specification

### Props & State
```typescript
interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}
```

### Navigation Item Shape
```typescript
interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;        // If omitted, always visible (e.g., Dashboard)
  badge?: number | string;    // Optional badge (e.g., unread notifications count)
  children?: NavItem[];       // Optional sub-navigation (2 levels max)
  group?: string;             // Section grouping label
}
```

### Navigation Sections
```typescript
const NAV_SECTIONS = [
  {
    group: "Overview",
    items: [
      { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ]
  },
  {
    group: "Support",
    items: [
      { id: "tickets-own", label: "My Tickets", href: "/tickets/mine", icon: TicketIcon, permission: "tickets:read_own" },
      { id: "tickets-all", label: "All Tickets", href: "/tickets", icon: TicketIcon, permission: "tickets:read_all" },
      { id: "incidents", label: "Incidents", href: "/incidents", icon: AlertTriangle, permission: "tickets:read_all" },
    ]
  },
  {
    group: "Infrastructure",
    items: [
      { id: "assets", label: "Assets", href: "/assets", icon: Monitor, permission: "assets:read" },
      { id: "inventory", label: "Inventory", href: "/inventory", icon: Package, permission: "inventory:read" },
      { id: "maintenance", label: "Maintenance", href: "/maintenance", icon: Wrench, permission: "assets:update" },
    ]
  },
  {
    group: "Intelligence",
    items: [
      { id: "reports", label: "Reports", href: "/reports", icon: BarChart2, permission: "reports:view" },
      { id: "analytics", label: "Analytics", href: "/analytics", icon: TrendingUp, permission: "reports:view" },
      { id: "knowledge-base", label: "Knowledge Base", href: "/knowledge-base", icon: BookOpen },
    ]
  },
  {
    group: "Administration",
    items: [
      { id: "users", label: "Users", href: "/users", icon: Users, permission: "users:read" },
      { id: "departments", label: "Departments", href: "/departments", icon: Building2, permission: "departments:manage" },
      { id: "audit", label: "Audit Log", href: "/audit", icon: Shield, permission: "audit:read" },
      { id: "settings", label: "Settings", href: "/settings", icon: Settings, permission: "settings:manage" },
    ]
  }
];
```

### Active State
Use `useMatch` from React Router to determine which nav item is active. Apply `bg-primary/10 text-primary` for active state, and `hover:bg-muted` for hover.

---

## 6. Navbar Component Specification

### Layout (Desktop)
```
┌─────────────────────────────────────────────────────────────────┐
│ [Breadcrumb]              [Search]    [🔔] [🌙] [Avatar ▾]      │
└─────────────────────────────────────────────────────────────────┘
```

### Layout (Mobile)
```
┌─────────────────────────────────────────────────────────────────┐
│ [≡]  CampusCare                            [🔔] [Avatar ▾]      │
└─────────────────────────────────────────────────────────────────┘
```

### Navbar is `position: sticky; top: 0; z-index: 40` — stays visible while page content scrolls.

---

## 7. Breadcrumb Component Specification

Breadcrumbs are derived from the current route path automatically.

```typescript
// Route configuration includes metadata for breadcrumb generation
const routes = [
  {
    path: "/assets/:assetId/edit",
    breadcrumb: [
      { label: "Assets", href: "/assets" },
      { label: ":assetName", href: "/assets/:assetId" }, // Dynamic segment
      { label: "Edit" }  // Current page (no link)
    ]
  }
];
```

**Visual:** `Assets / Laptops / ThinkPad T14 / Edit`  
**Separator:** `/` in `text-muted-foreground`  
**Last segment:** No link, `font-medium text-foreground`

---

## 8. User Menu Component Specification

Triggered by clicking the user avatar in the navbar.

**Menu items:**
```
[Avatar] John Smith
          Admin

──────────────────
👤 My Profile
⚙️  Account Settings
──────────────────
🌙 Theme
──────────────────
🚪 Sign Out
```

Implemented using `shadcn/ui` `DropdownMenu` component.

---

## 9. Notification Bell Specification

```typescript
interface NotificationBellState {
  unreadCount: number;       // Badge count
  isOpen: boolean;           // Popover open state
  notifications: Notification[]; // Recent 10 notifications
}
```

**Badge:** Shows count up to `99`, then `99+`. Hidden when count is 0.  
**Popover content:** List of recent notifications with mark-as-read action.  
**Real-time:** Unread count updated via Socket.IO `notification:new` event (Phase 1 scaffolded, Phase 3 fully implemented).

---

## 10. Theme Switch Specification

```typescript
type Theme = "light" | "dark" | "system";
```

**Behavior:**
1. `system` — follows OS `prefers-color-scheme`
2. `light` / `dark` — explicit override
3. Preference saved to `localStorage` key `"campuscare-theme"`
4. On mount, reads `localStorage` → applies class `.dark` to `<html>` element
5. System preference changes trigger re-evaluation when set to `system`

**Implementation:** Uses `useTheme` hook + `ThemeProvider` context.

**Component:** A simple 3-way toggle button (Sun → Moon → Monitor icons).

---

## 11. Footer Component Specification

Minimal. Visible only on desktop. Contains:
- Copyright `© 2024 CampusCare`
- Version `v1.0.0`
- Optional: `Privacy Policy` and `Terms of Service` links

Height: 48px. Background: `bg-background`. Border-top: `border-border`.

---

## 12. Mobile Sidebar Behavior

On mobile (`< 768px`):
1. Sidebar is `position: fixed`, full height, `width: 280px`, `transform: translateX(-100%)` when closed
2. Hamburger button in Navbar toggles sidebar
3. Dark overlay (`bg-black/50`) appears behind sidebar when open
4. Clicking overlay or pressing `Escape` closes sidebar
5. Navigating to a new route automatically closes the sidebar

**Animation:** `transition-transform duration-200 ease-in-out` — fast enough to feel snappy without being jarring.

---

## 13. AppLayout Code Structure

```tsx
// app/layouts/AppLayout.tsx
export function AppLayout() {
  const [isCollapsed, setIsCollapsed] = useLocalStorage("sidebar-collapsed", false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        isMobileOpen={isMobileOpen}
        onToggle={() => setIsCollapsed(!isCollapsed)}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          isSidebarCollapsed={isCollapsed}
          onMobileMenuToggle={() => setIsMobileOpen(!isMobileOpen)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
```

---

## 14. Accessibility Requirements

- All navigation items have `aria-label` for screen readers
- Sidebar collapse button has `aria-expanded` state
- Mobile overlay has `aria-hidden="true"`
- User menu dropdown follows `combobox` ARIA pattern (via shadcn/ui)
- Notification popover uses `aria-live="polite"` for dynamic count updates
- Keyboard navigation: `Tab` through nav items, `Enter` to activate, `Escape` to close overlays
- Active nav item has `aria-current="page"`

---

## 15. Performance Considerations

- Navigation items are statically defined — no async loading for the shell
- Avatar image is lazy-loaded with fallback initials
- Notification count is updated via WebSocket (no polling)
- Sidebar state (collapsed/expanded) persisted in `localStorage` — no layout shift on reload
- Shell components do NOT use `React.memo` — they render rarely and are not in hot paths

---

## 16. Future Extensibility

- **Multi-campus selector:** Add a campus switcher dropdown to the Navbar
- **Pinned items:** Allow users to pin favorite nav items to the top of the sidebar
- **Notification categories:** Group notifications by type (ticket, asset, system) in the popover
- **Quick actions:** Add a Cmd+K command palette for power-user navigation (Phase 1 scaffolded)
