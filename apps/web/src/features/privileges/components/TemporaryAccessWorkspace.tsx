import React, { useState } from "react";
import { Clock3, History, ScrollText, ShieldCheck, ShieldPlus, SlidersHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog.js";
import { TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs.js";
import { PendingRequestsTab } from "./PendingRequestsTab.js";
import { ActivePermissionsTab } from "./ActivePermissionsTab.js";
import { GrantAccessTab } from "./GrantAccessTab.js";
import { HistoryTab } from "./HistoryTab.js";
import { ApprovalPoliciesTab } from "./ApprovalPoliciesTab.js";

type WorkspaceTab = "pending" | "active" | "grant" | "history" | "policies";

interface TemporaryAccessWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  /** Unlocks custom durations and the approval-policy editor. */
  isSystemAdmin?: boolean;
}

const TABS: { value: WorkspaceTab; label: string; icon: typeof ShieldCheck }[] = [
  { value: "pending", label: "Pending Requests", icon: ScrollText },
  { value: "active", label: "Active Permissions", icon: Clock3 },
  { value: "grant", label: "Grant Access", icon: ShieldPlus },
  { value: "history", label: "History", icon: History },
  { value: "policies", label: "Approval Policies", icon: SlidersHorizontal },
];

/**
 * The whole GTPE admin surface, rendered as a modal from User Management.
 * Deliberately not a route — the spec requires it to live inside Users.
 *
 * Each tab's queries are `enabled` only while that tab is the active one, so
 * opening the dialog costs a single request rather than five.
 */
export function TemporaryAccessWorkspace({
  isOpen,
  onClose,
  isSystemAdmin = false,
}: TemporaryAccessWorkspaceProps) {
  const [tab, setTab] = useState<WorkspaceTab>("pending");

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" />
            Temporary Access Control
          </DialogTitle>
          <DialogDescription>
            Grant, review and audit time-boxed privilege escalations. Every grant expires
            automatically and is recorded in the audit trail.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 min-h-0 flex-col">
          <TabsList
            activeValue={tab}
            onValueChange={(value: string) => setTab(value as WorkspaceTab)}
            className="shrink-0"
          >
            {TABS.map(({ value, label, icon: Icon }) => (
              <TabsTrigger key={value} value={value}>
                <Icon className="size-3.5" />
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto pt-4 pr-1 -mr-1">
            <TabsContent value="pending" activeValue={tab}>
              <PendingRequestsTab active={isOpen && tab === "pending"} />
            </TabsContent>
            <TabsContent value="active" activeValue={tab}>
              <ActivePermissionsTab active={isOpen && tab === "active"} />
            </TabsContent>
            <TabsContent value="grant" activeValue={tab}>
              <GrantAccessTab active={isOpen && tab === "grant"} isSystemAdmin={isSystemAdmin} />
            </TabsContent>
            <TabsContent value="history" activeValue={tab}>
              <HistoryTab active={isOpen && tab === "history"} />
            </TabsContent>
            <TabsContent value="policies" activeValue={tab}>
              <ApprovalPoliciesTab active={isOpen && tab === "policies"} />
            </TabsContent>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
