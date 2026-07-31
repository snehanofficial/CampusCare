# CampusCare UX Operating System (UX OS) — Design Bible

> **Status:** Production UX OS Specification  
> **Authority:** Single Source of Truth for all CampusCare UI/UX Implementations  
> **Compliance Target:** WCAG 2.2 AA Enterprise Accessibility  

---

## 1. Core UX Operating System Principles

CampusCare is designed for daily, high-volume enterprise operations by Students, Faculty, Technicians, Department Admins, and System Admins.

Every screen and component must adhere to these 10 core principles:

1. **Human UI > AI UI:** Avoid SaaS tropes, glassmorphism, floating neon cards, gradient cards, oversized radii (`rounded-2xl`), drop-shadow blurs, or decorative animations.
2. **Function Before Decoration:** Visual elements must communicate data, state, focus, or action hierarchy.
3. **Typography Before Color:** Rely on weight, font-size contrast, uppercase tracking, and tabular figures before introducing background fills.
4. **Spacing Before Borders:** Structure content rhythm using standard 4px/8px grid tokens before adding divider lines.
5. **Hierarchy Before Effects:** Establish clear visual hierarchy through container nesting and typography scales rather than drop shadows.
6. **Recognition Over Recall:** Keep navigation, actions, saved view filters, and status indicators in predictable, standardized locations across all modules.
7. **Progressive Disclosure:** Present high-level metrics and lists first; disclose dense key-value attributes and audit logs in structured sidebars or drawers.
8. **Minimal Cognitive Load:** Avoid card-inside-card clutter. Use clean border-first structural layout containers.
9. **WCAG 2.2 AA Accessibility:** High contrast text ratio (>= 4.5:1), visible focus rings (`ring-1 ring-ring`), keyboard skip links, explicit aria labels, and indicator shapes alongside colors.
10. **Zero Design Drift:** No one-off inline styles or page-specific visual hacks. Extend the Design Tokens & Components first, then consume everywhere.

---

## 2. Design Token Architecture

CampusCare enforces a strict 4-Tier token cascade defined in `apps/web/src/app/globals.css`:

```
Primitive Tokens (OKLCH Color Scales, Base Radii, Transition Speeds)
  └── Semantic Tokens (--background, --foreground, --card, --surface-subtle, --primary)
       └── Component Tokens (--button-height, --input-border, --card-radius)
            └── Application Tokens (--density-row-height, --density-padding-y)
```

### Color Palette — "Warm Paper & Graphite"

**Color Space:** OKLCH (perceptually uniform — not HSL, not Tailwind palette names)

**Material Inspiration:** Unbleached paper, graphite pencil ink, warm linen, brushed steel, deep charcoal.

**Light Theme — Warm Paper:**
| Role | Token | OKLCH Value | Description |
|:---|:---|:---|:---|
| Background | `--background` | `oklch(97.8% 0.006 80)` | Off-white with paper warmth |
| Card | `--card` | `oklch(99.3% 0.003 80)` | Pristine card surface |
| Surface Subtle | `--surface-subtle` | `oklch(95.5% 0.010 78)` | Linen/parchment inset |
| Foreground | `--foreground` | `oklch(18% 0.014 55)` | Deep warm graphite ink |
| Muted Text | `--muted-foreground` | `oklch(50% 0.010 60)` | Warm mid-gray |
| Primary | `--primary` | `oklch(44% 0.130 224)` | Steel teal — not Tailwind blue |
| Border | `--border` | `oklch(87.5% 0.010 74)` | Warm light border |

**Dark Theme — Warm Charcoal:**
| Role | Token | OKLCH Value | Description |
|:---|:---|:---|:---|
| Background | `--background` | `oklch(15% 0.008 50)` | Deep warm charcoal (50° = no blue) |
| Card | `--card` | `oklch(18.5% 0.008 50)` | Raised surface |
| Surface Subtle | `--surface-subtle` | `oklch(21.5% 0.008 50)` | Inset surface |
| Foreground | `--foreground` | `oklch(92% 0.005 76)` | Warm off-white |
| Muted Text | `--muted-foreground` | `oklch(60% 0.009 60)` | Warm graphite |
| Primary | `--primary` | `oklch(62% 0.130 224)` | Steel teal for dark surfaces |

> **Design Governance:** The dark theme uses `50°` hue anchor, which places it in the warm orange-adjacent range. This prevents the blue-black (`hsl(222 47% X%)`) pattern that characterizes shadcn/ui dark mode.

### Status Badge Tokens

Status and priority colors are defined as CSS variable pairs (`--badge-*-bg`, `--badge-*-fg`, `--badge-*-border`) and exposed as `.cc-badge-*` utility classes. Never use Tailwind color names (`emerald-`, `sky-`, `blue-`, `amber-`) for status indicators.

| Class | State |
|:---|:---|
| `.cc-badge-open` | Open / New tickets |
| `.cc-badge-progress` | In Progress |
| `.cc-badge-assigned` | Assigned / High priority / Warning SLA |
| `.cc-badge-resolved` | Resolved / Active / Healthy |
| `.cc-badge-neutral` | Closed / Retired / Low priority |
| `.cc-badge-critical` | Critical / SLA Breached |
| `.cc-badge-warning` | Warning SLA |

### Border Radii System (Restrained Enterprise Radii)
- `--radius-xs: 2px` (Small buttons, status tags, kbd shortcuts)
- `--radius-sm: 4px` (Cards, inputs, tables, dropdown menus, dialogs)
- `--radius-md: 6px` (Modals, global popovers)

> **Governance:** Never use `rounded-lg`, `rounded-xl`, or `rounded-2xl`. These are decorative radii that signal AI-generated or SaaS template aesthetics.

---

## 3. UI Density System

Technicians and System Admins managing large queues require a high-density viewport option. CampusCare supports two global density modes:

| Attribute | Comfortable (Default) | Compact Mode |
| :--- | :--- | :--- |
| **Table Row Height** | 40px (`h-10`) | 32px (`h-8`) |
| **Cell Padding** | `px-3 py-2` | `px-2.5 py-1 text-[11px]` |
| **Form Inputs** | `h-8 px-3` | `h-7 px-2.5 text-xs` |
| **Action Toolbar** | `h-10 px-3` | `h-8 px-2` |

Density state is managed via `useDensity()` hook and persisted to `localStorage`.

---

## 4. Standardized Layout & Navigation Architecture

Every application route must mount within `AppLayout`:

```
┌────────────────────────────────────────────────────────────────────────┐
│ AppLayout                                                              │
│ ┌────────────┬───────────────────────────────────────────────────────┐ │
│ │ Sidebar    │ Navbar (Breadcrumb, Search Cmd+K, Density, Theme, User)│ │
│ │ ┌────────┐ │ ├───────────────────────────────────────────────────┤ │
│ │ │ Logo   │ │ main #main-content                                  │ │
│ │ ├────────┤ │ ┌─────────────────────────────────────────────────┐ │ │
│ │ │ Nav    │ │ │ PageHeader                                      │ │ │
│ │ │ Items  │ │ ├─────────────────────────────────────────────────┤ │ │
│ │ ├────────┤ │ │ FilterToolbar / ActionToolbar                   │ │ │
│ │ │ User   │ │ ├─────────────────────────────────────────────────┤ │ │
│ │ └────────┘ │ │ DataTable / Entity Details                      │ │ │
│ └────────────┴─┴─────────────────────────────────────────────────┴─┘ │
└────────────────────────────────────────────────────────────────────────┘
```

- **Skip Link:** `<a href="#main-content" className="skip-to-content">Skip to main content</a>`
- **Global Search:** Activated via `⌘K` or `Ctrl+K` opening `CommandPalette.tsx`.

---

## 5. UI Components & Interaction Standards

### 5.1 Buttons (`Button`)
- **Variants:** `default` (Primary Steel Teal), `secondary`, `outline`, `ghost`, `destructive`, `link`.
- **Loading State:** Automatically disables and renders `Loader2` spinner.
- **Sizes:** `xs` (28px), `sm` (32px), `md` (36px), `lg` (40px), `icon`.

### 5.2 Status Badges (`StatusBadge`)
- **Accessibility Requirement:** Every status badge must render a shape/icon cue (`CircleDot`, `Clock`, `CheckCircle2`, `ShieldAlert`) alongside color.
- **Colors:** Semantic `.cc-badge-*` classes — never hardcoded Tailwind color names.

### 5.3 Tabs (`Tabs` / `TabsList` / `TabsTrigger`)
- **Style:** Enterprise underline style — flat bottom border with 2px primary indicator.
- **Never use:** Pill/chip style (`bg-muted rounded-md p-1`). That is a shadcn pattern.

### 5.4 Data Tables (`DataTable`)
- **Headers:** Sticky header, uppercase tracking, 10px bold text.
- **Zebra & Hover:** Highlighting on hover (`hover:bg-muted/40`), selected row highlight (`data-[state=selected]:bg-primary/5`).
- **Empty States:** Renders standard `EmptyState` component with icon and clear recovery action.

---

## 6. WCAG 2.2 AA Accessibility Audit Checklist

- [x] Visible focus rings on all interactive elements (`focus-visible:ring-1 focus-visible:ring-ring`).
- [x] Color contrast ratio >= 4.5:1 for standard text, >= 3:1 for headers and active borders.
- [x] Keyboard skip to content link present in layout root.
- [x] Semantic HTML landmarks (`header`, `nav`, `main`, `aside`, `footer`).
- [x] Reduced motion query support (`@media (prefers-reduced-motion: reduce)`).
- [x] Status badges use both color AND icon shape to convey state (not color alone).

---

## 7. Future Module Development & Design Governance Rules

Whenever adding a new module or page to CampusCare:

1. **Do NOT use hardcoded Tailwind color palette names** (`blue-`, `emerald-`, `sky-`, `amber-`, `zinc-`, `slate-`, etc.).
2. **Use only semantic tokens** from the `@theme` block or CSS variable pairs.
3. **Reuse standard templates:**
   - List views → Use `EntityListTemplate`
   - Detail views → Use `EntityDetailsTemplate`
   - Dashboards → Use `DashboardTemplate`
4. **Reuse standard components:** `Button`, `Input`, `Select`, `Card`, `StatusBadge`, `DataTable`, `Dialog`.
5. **Use approved token colors:** `primary`, `secondary`, `muted`, `accent`, `destructive`, `success`, `warning`, `info`.
6. **For new status colors:** extend the `--badge-*` token pairs in `globals.css`, then add a `.cc-badge-*` utility class.
7. **Run Verification Commands:**
   ```powershell
   pnpm --filter web typecheck
   pnpm --filter web lint
   ```
