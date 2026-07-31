import { Rows, ListFilter } from "lucide-react";
import { useDensity } from "../../hooks/useDensity.js";

export function DensitySwitch() {
  const { density, toggleDensity } = useDensity();

  return (
    <button
      onClick={toggleDensity}
      className="flex items-center gap-1.5 rounded-sm border border-input bg-muted/30 px-2 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-ring"
      title={`Current UI Density: ${density}. Click to toggle.`}
      aria-label="Toggle UI Density"
    >
      {density === "compact" ? (
        <>
          <Rows className="size-3.5" />
          <span className="hidden sm:inline">Compact</span>
        </>
      ) : (
        <>
          <ListFilter className="size-3.5" />
          <span className="hidden sm:inline">Comfortable</span>
        </>
      )}
    </button>
  );
}
export default DensitySwitch;
