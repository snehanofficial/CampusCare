# THEMING.md
## CampusCare — Theming Architecture

> **Status:** Phase 1 Implementation Reference  
> **Stack:** Tailwind CSS v4 · CSS Custom Properties · `useTheme` hook

---

## 1. Purpose

This document defines the theming system for CampusCare — specifically how Light Mode, Dark Mode, and System preference are implemented, persisted, and toggled.

---

## 2. Implementation Strategy

### How Dark Mode Works in Tailwind CSS v4

Tailwind v4 supports a CSS class-based dark mode strategy. When the class `dark` is applied to the `<html>` element, all `.dark:` variant classes become active.

**Configuration in globals.css:**
```css
@import "tailwindcss";

/* No configuration needed in Tailwind v4 for class-based dark mode —
   it is the default. The .dark class on <html> activates dark: variants. */
```

**CSS variables toggle:**
```css
@layer base {
  :root {
    /* Light mode variables */
    --background: hsl(0 0% 100%);
    --foreground: hsl(222 47% 11%);
    /* ... */
  }

  .dark {
    /* Dark mode variables */
    --background: hsl(222 47% 6%);
    --foreground: hsl(210 40% 98%);
    /* ... */
  }
}
```

When `<html class="dark">` is set, all CSS variables are overridden by the `.dark` block.

---

## 3. Theme Types

```typescript
// types/theme.ts
export type Theme = "light" | "dark" | "system";
```

- **`light`:** Forces light theme regardless of OS preference
- **`dark`:** Forces dark theme regardless of OS preference
- **`system`:** Follows the OS `prefers-color-scheme` media query; updates automatically if the user changes their OS preference

---

## 4. ThemeProvider

```tsx
// app/providers/ThemeProvider.tsx
import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "campuscare-theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark"; // The actual applied theme (no "system")
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "system";
    return (localStorage.getItem(STORAGE_KEY) as Theme) ?? "system";
  });

  const resolvedTheme = theme === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : theme;

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  // Listen for OS preference changes when in system mode
  useEffect(() => {
    if (theme !== "system") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(mediaQuery.matches ? "dark" : "light");
    };

    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(STORAGE_KEY, newTheme);
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
```

---

## 5. ThemeSwitch Component

```tsx
// components/navigation/ThemeSwitch.tsx
import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Toggle theme">
          {theme === "light" && <Sun className="size-4" />}
          {theme === "dark" && <Moon className="size-4" />}
          {theme === "system" && <Monitor className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 size-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 size-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 size-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

---

## 6. Provider Order in App

```tsx
// main.tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>          {/* ← Must be outermost */}
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors />
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>
);
```

`ThemeProvider` must wrap everything to prevent a flash of the wrong theme on load.

---

## 7. Preventing Flash of Unstyled Content (FOUC)

To prevent a visible flash when the page loads in dark mode but the browser initially renders light mode, add an inline script before any React JavaScript loads:

```html
<!-- index.html — in <head> before any <script> tags -->
<script>
  (function() {
    var stored = localStorage.getItem("campuscare-theme");
    var theme = stored === "dark" ? "dark"
               : stored === "light" ? "light"
               : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.classList.add(theme);
  })();
</script>
```

This runs synchronously before the page renders, eliminating the flash.

---

## 8. Sonner Toast Theming

Sonner automatically detects the current theme:

```tsx
// In app root:
<Toaster theme={resolvedTheme} position="top-right" richColors />
```

Pass `resolvedTheme` (not `theme`) since Sonner needs `"light"` or `"dark"`, not `"system"`.

---

## 9. Color Token Dark Mode Coverage

Every CSS variable defined in `:root` has a corresponding override in `.dark`. The complete token set is in [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

**Verification checklist:**
- [ ] All text reads at WCAG 4.5:1 contrast in both modes
- [ ] Border colors visible in both modes
- [ ] Card/surface distinction clear in dark mode
- [ ] Focus rings visible in both modes
- [ ] Status badge colors tested in dark mode (de-saturate backgrounds, keep text)

---

## 10. Future Extensibility

- **High Contrast Mode:** Add a `high-contrast` CSS class that overrides token values with maximally contrasting colors (WCAG AAA)
- **Custom Brand Colors:** Institutions can override the `--primary` token at build time for white-label deployments
- **CSS Color Scheme API:** Add `color-scheme: light dark` meta tag for proper browser UI theming (scrollbars, form controls)
