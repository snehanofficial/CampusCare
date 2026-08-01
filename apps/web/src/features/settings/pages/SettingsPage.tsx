import React, { useState } from "react";
import { SettingsTemplate } from "../../../components/templates/SettingsTemplate.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card.js";
import { Switch } from "../../../components/ui/switch.js";
import { Input } from "../../../components/ui/input.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../../../components/ui/select.js";
import { isMockEnabled, setMockEnabled } from "../../../mocks/index.js";
import { Settings, Sliders, Server, Shield, Bell, RefreshCw, Mail } from "lucide-react";
import { toast } from "sonner";
import { NotificationPreferencesSettings } from "../components/NotificationPreferencesSettings.js";
import { OfflineSyncSettings } from "../components/OfflineSyncSettings.js";
import { EmailPreferencesSettings } from "../components/EmailPreferencesSettings.js";

export function SettingsPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [useMocks, setUseMocks] = useState(isMockEnabled());

  // general configs state
  const [orgName, setOrgName] = useState("TechNova University Campus");
  const [lang, setLang] = useState("en-US");

  // SLA states
  const [slaCritical, setSlaCritical] = useState("4");
  const [slaHigh, setSlaHigh] = useState("8");
  const [slaMed, setSlaMed] = useState("24");

  const handleMockToggle = (checked: boolean) => {
    setMockEnabled(checked);
    setUseMocks(checked);
    toast.success(`Mock adapter layer ${checked ? "enabled" : "disabled"}.`);
  };

  const handleSaveAll = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success("System configurations persistent storage updated successfully.");
    }, 600);
  };

  const tabs = [
    {
      id: "general",
      label: "General Profile",
      icon: Settings,
      content: (
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 py-4 px-6">
            <CardTitle className="text-sm font-bold text-foreground">Global Identity Settings</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-normal mt-0.5">
              Change organization details, locales, and mail formatting flags.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Organization Name</label>
              <Input
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Default Language</label>
              <Select value={lang} onValueChange={setLang}>
                <SelectTrigger className="text-xs h-9 bg-card">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">English (United States)</SelectItem>
                  <SelectItem value="en-GB">English (United Kingdom)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "sla",
      label: "SLA Targets",
      icon: Sliders,
      content: (
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 py-4 px-6">
            <CardTitle className="text-sm font-bold text-foreground">SLA Warning Thresholds</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-normal mt-0.5">
              Set target response and resolution durations in hours per incident priority level.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Critical Severity (hrs)</label>
                <Input
                  value={slaCritical}
                  onChange={(e) => setSlaCritical(e.target.value)}
                  type="number"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">High Severity (hrs)</label>
                <Input
                  value={slaHigh}
                  onChange={(e) => setSlaHigh(e.target.value)}
                  type="number"
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase">Medium Severity (hrs)</label>
                <Input
                  value={slaMed}
                  onChange={(e) => setSlaMed(e.target.value)}
                  type="number"
                  className="text-xs"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      ),
    },
    {
      id: "notifications",
      label: "Notification Channels",
      icon: Bell,
      content: <NotificationPreferencesSettings />,
    },
    {
      id: "emailPreferences",
      label: "Email Delivery Preferences",
      icon: Mail,
      content: <EmailPreferencesSettings />,
    },
    {
      id: "sync",
      label: "Offline Sync",
      icon: RefreshCw,
      content: <OfflineSyncSettings />,
    },
    {
      id: "mocks",
      label: "Mocking Adapters",
      icon: Server,
      content: (
        <Card className="border border-border bg-card">
          <CardHeader className="border-b border-border/40 py-4 px-6">
            <CardTitle className="text-sm font-bold text-foreground">Development Mock Database</CardTitle>
            <CardDescription className="text-xs text-muted-foreground leading-normal mt-0.5">
              Force route queries to resolve with simulated local JSON profiles instead of calling backend APIs.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/40">
              <div className="space-y-0.5 pr-4">
                <h4 className="text-xs font-bold text-foreground">Activate Mock Mode</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Turn on simulated server latency and test mock data tables directly in the UI.
                </p>
              </div>
              <Switch checked={useMocks} onCheckedChange={handleMockToggle} />
            </div>
          </CardContent>
        </Card>
      ),
    },
  ];

  return (
    <SettingsTemplate
      title="System Settings"
      description="Configure core application layouts, SLA targets, and API gateway routing profiles."
      tabs={tabs}
      isSaving={isSaving}
      onSave={handleSaveAll}
    />
  );
}
export default SettingsPage;
