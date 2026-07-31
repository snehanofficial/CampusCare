# CampusCare Design System

This document serves as the single source of truth for the CampusCare UI. It defines the visual language, design principles, and component guidelines for the platform, ensuring consistency, accessibility, and an enterprise-grade user experience.

---

## 1. Design Philosophy

CampusCare is an enterprise productivity application used by Students, Faculty, Technicians, and Administrators for Campus IT Service Management.

Our UI must immediately communicate:
- **Clarity:** Information must be easy to parse and act upon.
- **Speed:** The interface should feel incredibly fast and responsive.
- **Trust & Professionalism:** The design must inspire confidence in the system's reliability.
- **Reliability:** Predictable interactions and consistent layouts.

**Visual Principles:**
- **Do:** Use calm, neutral, modern, lightweight, and highly readable aesthetics.
- **Don't:** No generic Dribbble concepts, flashy animations, random gradients, neumorphism, glassmorphism, glowing buttons, or oversized cards. Avoid saturated and "neon" colors.

---

## 2. Research Summary

The CampusCare design language draws inspiration from industry-leading enterprise design systems, heavily referencing:
- **Google Material Design 3:** For intentional use of typography and subtle elevations, while avoiding its more playful "Material You" consumer aspects.
- **IBM Carbon Design System:** For its deep focus on data-dense tables, accessibility, and strict grid systems tailored for enterprise environments.
- **Atlassian Design System:** For practical component structures, clear hierarchy, and trusted fundamentals used in productivity tools like Jira.
- **GitHub Primer:** For its composable foundations, meaningful use of color (restrained semantic palette), and developer-friendly design tokens.
- **Microsoft Fluent 2:** For its emphasis on minimizing visual clutter to keep users centered and calm.

**Inspiration:** The dashboard layout and feel should invoke tools like Google Workspace Admin, GitHub, Linear, and Notion—not crypto dashboards, e-commerce sites, or SaaS landing pages.

---

## 3. Color System

CampusCare uses a restrained, semantic color palette. Every color application must have semantic meaning; we do not color elements just for decoration.

**Primary Colors:** Communicate trust and stability.
- `Slate` & `Gray`: Core background, surface, and text colors.
- `Blue`: Primary brand and action color (e.g., primary buttons, active links).
- `Teal`: Secondary accents (used sparingly).
- `Indigo`: Minimal use, specifically for focus states or premium/admin features.

**Semantic Colors:**
- **Success:** `Green` (e.g., Resolved tickets, successful actions).
- **Warning:** `Amber` (e.g., Nearing SLA breaches, pending approvals).
- **Error:** `Red` (e.g., Critical incidents, destructive actions).

*Note: Use desaturated variations for backgrounds and keep saturated colors strictly for small UI indicators (badges, icons, primary text).*

---

## 4. Typography

**Primary Font Family:** `Inter` (or `Geist`)
We use a clean, highly legible sans-serif typeface designed for computer screens and complex data tables.

**Type Scale (Mobile / Desktop):**
- **Display:** `text-4xl` / `text-5xl` (Minimal use, perhaps only on login or major landing states)
- **Heading 1:** `text-2xl` / `text-3xl` (Page titles)
- **Heading 2:** `text-xl` / `text-2xl` (Section titles, card headers)
- **Title:** `text-lg` / `text-xl` (Sub-sections, modal titles)
- **Body:** `text-sm` / `text-base` (Default reading text, tables, descriptions)
- **Caption:** `text-xs` (Metadata, timestamps, small tags)
- **Mono:** Used specifically for code snippets, IDs (e.g., Ticket #INC-1029), and tabular numeric data.

---

## 5. Spacing System

Spacing is strictly based on an **8px base system**.
No arbitrary spacing values are permitted.

Allowed values:
- `4px` (0.25rem) - Internal component spacing (e.g., icon to text).
- `8px` (0.5rem) - Tight spacing between related elements (e.g., form label to input).
- `16px` (1rem) - Standard padding for cards, standard gaps.
- `24px` (1.5rem) - Medium section gaps, larger container padding.
- `32px` (2rem) - Distinct separation between different content blocks.
- `48px` (3rem) - Large page section breaks.
- `64px` (4rem) - Major layout structural spacing.

---

## 6. Layout Rules & Responsive Strategy

**Mobile First, Desktop Second**
Design for touch and small screens first, progressively enhancing the layout for wide desktop monitors.

- **Mobile (< 768px):** Stacked layouts, full-width buttons, bottom sheets for complex interactions, hidden sidebars behind hamburger menus.
- **Tablet (768px - 1024px):** Two-column layouts, modal dialogs instead of full-screen sheets.
- **Desktop (> 1024px):** Fixed sidebars, persistent navigation, multi-column dashboards, information-dense tables.

---

## 7. Grid System

CampusCare uses a fluid 12-column grid system with fixed gutters.
- **Mobile:** 4 columns, 16px margins/gutters.
- **Tablet:** 8 columns, 24px margins/gutters.
- **Desktop:** 12 columns, max-width constraints (e.g., `max-w-7xl` or fluid depending on the view), 24px or 32px gutters.

---

## 8. Dashboard Guidelines

Dashboards must prioritize information retrieval and task execution.
- **Hierarchy:** Use typography and subtle borders to establish hierarchy. Avoid deeply nested cards.
- **Whitespace:** Use whitespace to group related information, not heavy background colors.
- **Readable Tables:** Zebra striping or subtle border separators. Keep padding tight but readable (`py-2` or `py-3`). Align text properly (numbers right-aligned).
- **Minimal Charts:** Use simple, clean data visualizations. No 3D charts, no heavy shadows.
- **Clear Actions:** Primary actions should be immediately visible at the top right of the context or inline within table rows.

---

## 9. Component Guidelines

Every component must define its purpose, variants, sizes, states (default, hover, focus, disabled), accessibility, and usage rules.

*Brief examples of core components:*
- **Buttons:**
  - *Variants:* Primary (Blue bg), Secondary (Outline), Ghost (Transparent), Destructive (Red outline/bg).
  - *Sizes:* sm (32px), md (40px, default), lg (48px).
- **Inputs & Forms:**
  - Standard 40px height. Clean 1px borders (`border-slate-300`). Subtle focus ring (`ring-2 ring-blue-500/50`).
- **Tables:**
  - Left-aligned headers, subtle border-bottom on rows, hover states on rows for clickability.
- **Cards:**
  - 1px border (`border-slate-200`), white background, subtle shadow (`shadow-sm`). No massive drop shadows.
- **Dialogs & Sheets:**
  - Dark backdrop (`bg-slate-900/50`). Dialogs centered on desktop; bottom sheets on mobile.
- **Alerts & Toasts:**
  - Used sparingly. Toasts should auto-dismiss after 4s (unless containing an error). Alerts sit inline to provide context.
- **Empty States:**
  - Centralized, subtle gray icon, concise text, and a primary call-to-action button to resolve the empty state.
- **Command Palette:**
  - Triggered via `Cmd+K`. Used for power users to navigate quickly without mouse interaction.

*(Other components like Sidebar, Navbar, Breadcrumb, Badges, Tags, Skeleton, Charts, Search, Filters, Stat Cards follow similar strict, minimal enterprise styling.)*

---

## 10. Navigation Principles

- **Primary Navigation (Sidebar):** Left-aligned, collapsible on smaller screens. Contains core modules (Dashboard, Tickets, Assets, Users, Settings).
- **Top Navbar:** Contains global search, notifications, user profile, and context switching (e.g., Campus Selector).
- **Breadcrumbs:** Essential for deep hierarchical views (e.g., `Assets > Laptops > ThinkPad T14 > Edit`).

---

## 11. Iconography

- **Library:** [Lucide Icons](https://lucide.dev/).
- **Sizing:** Strictly `20px` (standard) or `24px` (large/touch targets).
- **Style:** Consistent stroke width (2px). No filled icons (except for specific active states if absolutely necessary, though outline is preferred).

---

## 12. Motion

Motion should be virtually invisible. It exists to provide context, not entertainment.
- **Duration:** `150ms` (micro-interactions like hover) to `250ms` (layout shifts, dialogs).
- **Easing:** Ease-out for appearing elements, ease-in for disappearing.
- **Avoid:** Bouncy physics, long fade-ins, flashy transitions, or moving large layout blocks abruptly.

---

## 13. Accessibility (WCAG 2.2 AA)

- **Focus Styles:** Every interactive element MUST have a visible focus ring (e.g., `focus-visible:ring-2`).
- **Contrast:** Text must meet at least 4.5:1 contrast ratio against backgrounds.
- **Keyboard Navigation:** Forms, dialogs, and tables must be fully navigable via keyboard (Tab, Enter, Space, Arrows).
- **Touch Targets:** Minimum 44x44px for icon buttons on mobile devices.
- **Reduced Motion:** Respect `prefers-reduced-motion` OS settings by disabling transitions.

---

## 14. Design Tokens (Tailwind v4 ready)

Do not hardcode values (e.g., avoid `w-[325px]` or `text-[#1e293b]`). Rely strictly on semantic tokens.

```css
@theme {
  /* Colors */
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  
  --color-surface-base: #ffffff;
  --color-surface-muted: #f8fafc;
  
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-text-tertiary: #94a3b8;

  --color-border-subtle: #f1f5f9;
  --color-border-default: #e2e8f0;
  --color-border-hover: #cbd5e1;

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Geist Mono', monospace;

  /* Radii */
  --radius-sm: 0.25rem; /* 4px */
  --radius-md: 0.375rem; /* 6px */
  --radius-lg: 0.5rem; /* 8px - Max rounding for most elements */

  /* Shadows (Subtle, flat design) */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
}
```

---

## 15. Do & Don't Examples

### Buttons
- ✅ **Do:** Use a clear primary button (`bg-blue-600 text-white`) for the main action on a page.
- ❌ **Don't:** Use multiple primary buttons next to each other. Use Ghost or Outline for secondary actions.

### Cards
- ✅ **Do:** Use a simple 1px border and white background to separate content.
- ❌ **Don't:** Add a heavy drop shadow and a glowing border to make a card "pop."

### Color
- ✅ **Do:** Use text-red-600 and a subtle red background (bg-red-50) for a critical alert.
- ❌ **Don't:** Make the entire screen or an entire large card saturated red.

### Forms
- ✅ **Do:** Top-align labels, stack inputs clearly with 8px spacing, provide inline validation text below the input.
- ❌ **Don't:** Rely solely on placeholder text for labels.

---
*Generated for CampusCare as the official UI architecture document.*
