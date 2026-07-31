import { Wrench } from "lucide-react";

export function MaintenancePage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center p-6 bg-background">
      <div className="flex size-14 items-center justify-center rounded-full bg-warning/10 text-warning mb-4 border border-warning/20">
        <Wrench className="size-6" />
      </div>
      <p className="text-[10px] font-bold tracking-widest text-warning uppercase">Downtime — Maintenance</p>
      <h1 className="mt-2 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
        Under Scheduled Maintenance
      </h1>
      <p className="mt-3 text-xs text-muted-foreground max-w-sm leading-relaxed">
        CampusCare is currently undergoing system upgrades. We will be back online shortly. Thank you for your patience!
      </p>
    </div>
  );
}
export default MaintenancePage;
