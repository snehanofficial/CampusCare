import React, { useEffect, useState } from "react";
import { Command } from "cmdk";
import { useNavigate } from "react-router";
import { Dialog, DialogContent } from "../ui/dialog.js";
import { Search, Monitor, Sun, Moon, LogOut, ShieldAlert, KeyRound } from "lucide-react";
import { useTheme } from "../../hooks/useTheme.js";
import { useAuth } from "../../hooks/useAuth.js";
import { isMockEnabled, setMockEnabled } from "../../mocks/index.js";
import { toast } from "sonner";

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const { logout } = useAuth();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    const openPalette = () => setOpen(true);

    document.addEventListener("keydown", down);
    window.addEventListener("palette:open", openPalette);
    return () => {
      document.removeEventListener("keydown", down);
      window.removeEventListener("palette:open", openPalette);
    };
  }, []);

  const runCommand = (action: () => void) => {
    setOpen(false);
    action();
  };

  const isMock = isMockEnabled();

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 max-w-lg shadow-lg border border-border">
          <Command className="flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground">
            <div className="flex items-center border-b px-3 border-border/40">
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input
                placeholder="Type a command or search..."
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden p-2 select-none">
              <Command.Empty className="py-6 text-center text-xs text-muted-foreground">No results found.</Command.Empty>
              
              <Command.Group heading="Navigation" className="overflow-hidden p-1 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
                <Command.Item
                  onSelect={() => runCommand(() => navigate("/dashboard"))}
                  className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-xs text-foreground outline-none hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                >
                  Go to Dashboard
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => navigate("/playground"))}
                  className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-xs text-foreground outline-none hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground"
                >
                  Go to UI Lab / Playground
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Settings & Utilities" className="overflow-hidden p-1 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
                <Command.Item
                  onSelect={() => runCommand(() => setTheme("light"))}
                  className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-xs text-foreground outline-none hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground gap-2"
                >
                  <Sun className="size-3.5" />
                  Set Theme to Light
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => setTheme("dark"))}
                  className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-xs text-foreground outline-none hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground gap-2"
                >
                  <Moon className="size-3.5" />
                  Set Theme to Dark
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => setTheme("system"))}
                  className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-xs text-foreground outline-none hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground gap-2"
                >
                  <Monitor className="size-3.5" />
                  Set Theme to System
                </Command.Item>
                <Command.Item
                  onSelect={() =>
                    runCommand(() => {
                      setMockEnabled(!isMock);
                      toast.success(`Mock adapter layer ${!isMock ? "ENABLED" : "DISABLED"}`);
                    })
                  }
                  className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-xs text-foreground outline-none hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground gap-2"
                >
                  <ShieldAlert className="size-3.5" />
                  {isMock ? "Disable Mock Adapter Layer" : "Enable Mock Adapter Layer"}
                </Command.Item>
              </Command.Group>

              <Command.Group heading="Account" className="overflow-hidden p-1 text-muted-foreground font-semibold text-[10px] uppercase tracking-wider">
                <Command.Item
                  onSelect={() => runCommand(() => navigate("/profile/sessions"))}
                  className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-xs text-foreground outline-none hover:bg-accent hover:text-accent-foreground data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground gap-2"
                >
                  <KeyRound className="size-3.5" />
                  Manage Active Devices
                </Command.Item>
                <Command.Item
                  onSelect={() => runCommand(() => logout())}
                  className="relative flex cursor-pointer select-none items-center rounded-md px-3 py-2 text-xs text-destructive outline-none hover:bg-destructive/10 data-[selected=true]:bg-destructive/10 gap-2"
                >
                  <LogOut className="size-3.5" />
                  Sign Out
                </Command.Item>
              </Command.Group>
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
export default CommandPalette;
