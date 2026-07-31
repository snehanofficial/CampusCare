# DESIGN_SYSTEM.md
## CampusCare — Design System Implementation Guide

> **Status:** Phase 1 Implementation Reference  
> **Stack:** Tailwind CSS v4 · shadcn/ui (new-york style) · Lucide Icons · Inter font  
> **Source of Truth for Design:** `docs/DESIGN.md`

---

## 1. Purpose

This document is the **implementation guide** for the CampusCare Design System. The design principles and visual language are defined in `docs/DESIGN.md`. This document covers the Tailwind v4 configuration, CSS token mapping, shadcn/ui setup, and the component implementation catalogue.

---

## 2. Tailwind CSS v4 — Architecture Notes

### CSS-First Configuration

Tailwind CSS v4 eliminates `tailwind.config.js`. All customization lives in `globals.css` using `@theme`:

```css
/* apps/web/src/app/globals.css */
@import "tailwindcss";

/* ============================================
   CAMPUSCARE DESIGN TOKENS
   ============================================ */

@theme inline {
  /* --- Color System --- */

  /* Primary: Blue (trust, actions) */
  --color-primary: hsl(217 91% 60%);         /* blue-500 */
  --color-primary-foreground: hsl(0 0% 98%);

  /* Secondary: Slate (neutral surfaces) */
  --color-secondary: hsl(210 40% 96%);        /* slate-100 */
  --color-secondary-foreground: hsl(222 47% 11%);

  /* Semantic */
  --color-destructive: hsl(0 84% 60%);
  --color-destructive-foreground: hsl(0 0% 98%);
  --color-success: hsl(142 71% 45%);
  --color-warning: hsl(38 92% 50%);

  /* Surfaces */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);

  /* --- Typography --- */
  --font-sans: "Inter", system-ui, -apple-system, sans-serif;
  --font-mono: "Geist Mono", "Fira Code", monospace;

  /* --- Border Radius --- */
  --radius-sm: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;  /* 6px */
  --radius-lg: 0.5rem;    /* 8px — maximum for most components */
  --radius-xl: 0.75rem;   /* 12px — modal dialogs only */

  /* --- Shadows (Subtle — enterprise flat aesthetic) --- */
  --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.04);
  --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.04);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.06), 0 2px 4px -2px rgb(0 0 0 / 0.04);

  /* --- Animation Durations --- */
  --duration-fast: 100ms;
  --duration-normal: 150ms;
  --duration-slow: 250ms;
}

/* ============================================
   LIGHT MODE CSS VARIABLES
   ============================================ */

@layer base {
  :root {
    --background: hsl(0 0% 100%);
    --foreground: hsl(222 47% 11%);        /* slate-900 */
    --card: hsl(0 0% 100%);
    --card-foreground: hsl(222 47% 11%);
    --popover: hsl(0 0% 100%);
    --popover-foreground: hsl(222 47% 11%);
    --primary: hsl(217 91% 60%);           /* blue-500 — action color */
    --primary-foreground: hsl(0 0% 98%);
    --secondary: hsl(210 40% 96%);         /* slate-100 — subtle surfaces */
    --secondary-foreground: hsl(222 47% 11%);
    --muted: hsl(210 40% 96%);             /* slate-100 */
    --muted-foreground: hsl(215 16% 47%);  /* slate-500 */
    --accent: hsl(210 40% 94%);            /* slate-200 */
    --accent-foreground: hsl(222 47% 11%);
    --destructive: hsl(0 84% 60%);         /* red-500 */
    --destructive-foreground: hsl(0 0% 98%);
    --border: hsl(214 32% 91%);            /* slate-200 */
    --input: hsl(214 32% 91%);
    --ring: hsl(217 91% 60%);              /* blue-500 focus ring */
    --radius: 0.5rem;
  }

  /* ============================================
     DARK MODE CSS VARIABLES
     ============================================ */

  .dark {
    --background: hsl(222 47% 6%);         /* Near-black slate */
    --foreground: hsl(210 40% 98%);        /* Off-white */
    --card: hsl(222 47% 8%);               /* Slightly elevated card */
    --card-foreground: hsl(210 40% 98%);
    --popover: hsl(222 47% 8%);
    --popover-foreground: hsl(210 40% 98%);
    --primary: hsl(213 94% 68%);           /* blue-400 — slightly lighter for dark */
    --primary-foreground: hsl(222 47% 6%);
    --secondary: hsl(215 28% 14%);         /* Subtle dark surface */
    --secondary-foreground: hsl(210 40% 98%);
    --muted: hsl(215 28% 14%);
    --muted-foreground: hsl(215 16% 57%);  /* Readable on dark */
    --accent: hsl(215 28% 18%);
    --accent-foreground: hsl(210 40% 98%);
    --destructive: hsl(0 72% 51%);
    --destructive-foreground: hsl(0 0% 98%);
    --border: hsl(215 28% 18%);
    --input: hsl(215 28% 18%);
    --ring: hsl(213 94% 68%);
  }

  /* ============================================
     BASE STYLES
     ============================================ */

  * {
    border-color: var(--border);
    @apply box-border;
  }

  body {
    background-color: var(--background);
    color: var(--foreground);
    font-family: var(--font-sans);
    font-feature-settings: "rlig" 1, "calt" 1;
    -webkit-font-smoothing: antialiased;
  }

  /* Scrollbar styling (enterprise-feel) */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--muted-foreground); }

  /* Focus visible ring — WCAG compliant */
  :focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: 2px;
  }

  /* Reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
  }
}
```

---

## 3. shadcn/ui Configuration

### `components.json` (Tailwind v4 compatible)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Why `style: "new-york"`?
The `new-york` style is shadcn's recommended enterprise style. It uses:
- Slightly rounded corners (not sharp, not pill-shaped)
- Consistent border weight
- Clean, minimal variants
- Better suited to data-dense interfaces than the older `default` style

**Note:** The `default` style is deprecated in recent shadcn/ui versions.

### Installing Components
```bash
pnpm dlx shadcn@latest add button input label dialog sheet dropdown-menu avatar badge separator tabs card scroll-area toast sonner
```

---

## 4. `cn()` Utility

All components use the `cn` utility to merge Tailwind class names correctly:

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

`twMerge` resolves Tailwind class conflicts (e.g., `text-sm text-lg` → `text-lg`).  
`clsx` handles conditional class strings.

---

## 5. Component Catalogue

### 5.1 Button

Variants follow DESIGN.md §9:

| Variant | Use | Example |
|:---|:---|:---|
| `default` | Primary actions | "Create Ticket", "Save" |
| `secondary` | Secondary actions | "Cancel", "View Details" |
| `outline` | Tertiary actions | "Export", "Share" |
| `ghost` | Subtle actions | Nav items, icon buttons |
| `destructive` | Dangerous actions | "Delete", "Revoke Access" |
| `link` | Inline text links | "View all →" |

Sizes: `sm` (32px height), `default` (40px), `lg` (48px)

```tsx
<Button variant="default" size="default">Create Ticket</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button variant="ghost" size="icon"><PlusIcon className="size-4" /></Button>
```

### 5.2 Input

Standard height: 40px. Clean 1px border. Subtle focus ring.

```tsx
<Input
  type="text"
  placeholder="Search tickets..."
  className="h-10"  // 40px
/>
```

### 5.3 Card

1px border, white background, `shadow-sm`. No heavy shadows.

```tsx
<Card>
  <CardHeader>
    <CardTitle>Open Tickets</CardTitle>
    <CardDescription>Active support requests</CardDescription>
  </CardHeader>
  <CardContent>
    {/* content */}
  </CardContent>
</Card>
```

### 5.4 Badge — Status Chips

```typescript
// components/common/StatusBadge.tsx
const TICKET_STATUS_CONFIG = {
  OPEN:        { label: "Open",        className: "bg-blue-50 text-blue-700 border-blue-200" },
  ASSIGNED:    { label: "Assigned",    className: "bg-amber-50 text-amber-700 border-amber-200" },
  IN_PROGRESS: { label: "In Progress", className: "bg-purple-50 text-purple-700 border-purple-200" },
  RESOLVED:    { label: "Resolved",    className: "bg-green-50 text-green-700 border-green-200" },
  CLOSED:      { label: "Closed",      className: "bg-slate-50 text-slate-600 border-slate-200" },
};

const PRIORITY_CONFIG = {
  LOW:      { label: "Low",      className: "bg-slate-50 text-slate-600 border-slate-200" },
  MEDIUM:   { label: "Medium",   className: "bg-blue-50 text-blue-700 border-blue-200" },
  HIGH:     { label: "High",     className: "bg-amber-50 text-amber-700 border-amber-200" },
  CRITICAL: { label: "Critical", className: "bg-red-50 text-red-700 border-red-200" },
};
```

### 5.5 Data Table

Uses TanStack Table v8 for sorting, filtering, pagination:

```tsx
// components/tables/DataTable.tsx
interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  pagination?: PaginationState;
  onPaginationChange?: (pagination: PaginationState) => void;
  rowClassName?: (row: TData) => string;
}
```

**Table styling rules (DESIGN.md §9):**
- Left-aligned headers
- `py-3 px-4` cell padding
- Hover state on rows: `hover:bg-muted/50`
- Numbers: right-aligned, monospace font
- Zebra striping: `even:bg-muted/20`

### 5.6 Page Header

Reusable component to ensure consistent page titles and action placement:

```tsx
// components/common/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;  // Rendered on the right
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
```

### 5.7 Stat Card

Dashboard stat cards — no glassmorphism, no gradients:

```tsx
// components/common/StatCard.tsx
interface StatCardProps {
  title: string;
  value: string | number;
  delta?: { value: number; positive: boolean };
  icon?: LucideIcon;
}
```

### 5.8 Empty State

Centralized empty state with icon, title, description, and CTA:

```tsx
// components/feedback/EmptyState.tsx
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}
```

### 5.9 Skeleton Loaders

Purpose-built skeletons for each data shape (not generic full-page spinners):

```tsx
// components/feedback/TicketListSkeleton.tsx
// components/feedback/TableSkeleton.tsx
// components/feedback/CardSkeleton.tsx
```

### 5.10 Alert/Toast

Toast notifications via Sonner (already installed):
```typescript
import { toast } from "sonner";

toast.success("Ticket created");
toast.error("Failed to update asset");
toast.warning("SLA breach imminent");
toast.info("New assignment received");
```

Sonner is positioned at `top-right`, auto-dismisses after 4 seconds for success/info, stays for error.

---

## 6. Typography Scale (Tailwind Classes)

| Token | Class | Size | Use |
|:---|:---|:---|:---|
| Display | `text-4xl font-bold` | 36px | Login page only |
| H1 | `text-2xl font-semibold` | 24px | Page titles (`PageHeader`) |
| H2 | `text-xl font-semibold` | 20px | Section headers, card titles |
| H3 | `text-lg font-medium` | 18px | Sub-sections, modal titles |
| Body | `text-sm` | 14px | Default reading text, tables |
| Small | `text-xs` | 12px | Metadata, timestamps, badges |
| Mono | `font-mono text-sm` | 14px | IDs, ticket numbers, code |

---

## 7. Spacing Principles (from DESIGN.md)

Use only the 8px-base grid values. Map to Tailwind:
- `4px` → `p-1`, `gap-1`
- `8px` → `p-2`, `gap-2`
- `16px` → `p-4`, `gap-4`
- `24px` → `p-6`, `gap-6`
- `32px` → `p-8`, `gap-8`

**Never use arbitrary values** like `p-[15px]` or `mt-[7px]`.

---

## 8. Icon Usage

- **Library:** Lucide React (`lucide-react@1.28.0`)
- **Standard size:** `size-4` (16px) for inline, `size-5` (20px) for buttons
- **Stroke width:** Default 2px (do not change)
- **Import:** Named imports only: `import { Ticket, Users } from "lucide-react"`

```tsx
<Button>
  <PlusIcon className="size-4 mr-2" />
  New Ticket
</Button>
```

---

## 9. Responsive Utilities Cheatsheet

| Pattern | Mobile | Tablet | Desktop |
|:---|:---|:---|:---|
| Grid cols | `grid-cols-1` | `md:grid-cols-2` | `lg:grid-cols-4` |
| Hidden | — | — | `hidden lg:block` |
| Show on mobile | `block` | `hidden` | — |
| Sidebar | `fixed left-0` (overlay) | `w-16` (icon-only) | `w-60` (expanded) |
| Dialog | `bottom-sheet` (sheet) | `dialog` | `dialog` |

---

## 10. Future Extensibility

- **Additional themes:** The CSS variable system makes adding a "high-contrast" accessibility theme trivial
- **White-label:** Replace CSS variables at the institution level for campus-specific branding
- **Component variants:** shadcn/ui's `cva()` pattern allows adding new variants without touching existing code
- **Animation library:** `tw-animate-css` is already referenced in the Tailwind v4 shadcn setup and can be expanded
