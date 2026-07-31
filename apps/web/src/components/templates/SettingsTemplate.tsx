import React, { useState } from "react";
import { PageHeader } from "../common/PageHeader.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "../ui/card.js";
import { Button } from "../ui/button.js";
import { Switch } from "../ui/switch.js";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../ui/tabs.js";
import { Input } from "../ui/input.js";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "../ui/select.js";
import { LoadingSpinner } from "../ui/loading-spinner.js";
import { Settings, Shield, Sliders, Server, type LucideIcon } from "lucide-react";

export interface SettingsTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  content: React.ReactNode;
}

interface SettingsTemplateProps {
  title: string;
  description?: string;
  tabs: SettingsTabItem[];
  isSaving?: boolean;
  onSave?: () => void;
}

export function SettingsTemplate({
  title,
  description,
  tabs,
  isSaving = false,
  onSave,
}: SettingsTemplateProps) {
  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 pb-4">
        <PageHeader title={title} description={description} />
        {onSave && (
          <Button
            onClick={onSave}
            disabled={isSaving}
            size="sm"
            className="text-xs h-9 min-w-28 cursor-pointer"
          >
            {isSaving ? <LoadingSpinner size="sm" className="mr-1.5" /> : null}
            Save Settings
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
          {/* Navigation vertical list sidebar for large screen, horizontal for mobile */}
          <div className="lg:col-span-1">
            <TabsList className="flex flex-row lg:flex-col lg:space-y-1 bg-transparent p-0 h-auto w-full border-b lg:border-b-0 lg:border-r border-border/40 justify-start overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 lg:pr-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold border-l-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-primary/5 data-[state=active]:text-primary text-muted-foreground hover:text-foreground cursor-pointer focus:outline-none lg:w-full lg:justify-start transition-colors"
                  >
                    <Icon className="size-4 flex-shrink-0" />
                    <span>{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Main Contents panel */}
          <div className="lg:col-span-3">
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0 outline-none">
                {tab.content}
              </TabsContent>
            ))}
          </div>
        </div>
      </Tabs>
    </div>
  );
}
export default SettingsTemplate;
