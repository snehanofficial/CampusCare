import { Sun, Moon, Monitor } from "lucide-react";
import { useTheme } from "../../hooks/useTheme.js";

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center rounded-md border border-input bg-muted/50 p-0.5">
      <button
        onClick={() => setTheme("light")}
        className={`rounded-sm p-1.5 transition-colors ${
          theme === "light"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Light Mode"
        aria-label="Light Mode"
      >
        <Sun className="size-4" />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`rounded-sm p-1.5 transition-colors ${
          theme === "dark"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="Dark Mode"
        aria-label="Dark Mode"
      >
        <Moon className="size-4" />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`rounded-sm p-1.5 transition-colors ${
          theme === "system"
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        }`}
        title="System Preference"
        aria-label="System Preference"
      >
        <Monitor className="size-4" />
      </button>
    </div>
  );
}
