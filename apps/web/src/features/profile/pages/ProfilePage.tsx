import React, { useState } from "react";
import { ProfileTemplate } from "../../../components/templates/ProfileTemplate.js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../../hooks/useAuth.js";
import { isMockEnabled, mockAdapters } from "../../../mocks/index.js";
import { authApi } from "../../auth/api/auth.api.js";
import { authStore } from "../../../lib/auth-store.js";
import { Input } from "../../../components/ui/input.js";
import { Button } from "../../../components/ui/button.js";
import { toast } from "sonner";
import type { Session } from "@campuscare/shared-types";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card.js";
import { Tag } from "../../../components/ui/tag.js";
import { Clock, Ban, CircleCheck } from "lucide-react";
import {
  useTechnicianOwnAvailability,
  useClearUnavailability,
  useCountdown,
} from "../../technicians/hooks/index.js";
import { resolveAvailabilityState, formatRemaining } from "../../technicians/utils/index.js";
import { SetUnavailabilityDialog } from "../../technicians/components/SetUnavailabilityDialog.js";

const getActiveSessionId = (): string | null => {
  const token = authStore.getAccessToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]!));
      return payload.sessionId || null;
    }
  } catch {
    // Return null if token is malformed
  }
  return null;
};

/**
 * Self-service technician availability card — shown only for TECHNICIAN
 * accounts. Reuses the exact same hooks/dialog/backend as the admin-facing
 * /technicians/:id page (TECH-001); no duplicate logic or second source of
 * truth for availability state.
 */
function MyAvailabilityCard({ technicianId }: { technicianId: string }) {
  const now = useCountdown(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: availability, refetch } = useTechnicianOwnAvailability(technicianId);
  const clearMutation = useClearUnavailability();

  const state = resolveAvailabilityState({
    isActive: true, // a logged-in session already implies an active account
    isManuallyUnavailable: availability?.isManuallyUnavailable ?? false,
    unavailableUntil: availability?.unavailableUntil ?? null,
    now,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs flex items-center justify-between">
          My Availability
          {state === "AVAILABLE" ? (
            <Tag variant="success">Available</Tag>
          ) : (
            <Tag variant="warning">Temporarily Unavailable</Tag>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Controls whether new tickets can be automatically assigned to you. This is separate from
          your account status — you stay fully logged in and able to work your existing tickets.
        </p>
        {state === "TEMPORARILY_UNAVAILABLE" && (
          <p className="text-xs text-foreground font-mono tabular-nums">
            Until {formatRemaining(availability?.unavailableUntil ?? null, now)}
            {availability?.reason && (
              <span className="block text-muted-foreground font-sans mt-1">Reason: {availability.reason}</span>
            )}
          </p>
        )}
        <div className="flex gap-2">
          {state === "TEMPORARILY_UNAVAILABLE" ? (
            <>
              <Button size="xs" variant="outline" className="text-xs" onClick={() => setIsDialogOpen(true)}>
                <Clock className="size-3 mr-1" />
                Extend
              </Button>
              <Button
                size="xs"
                variant="outline"
                className="text-xs text-success border-success/30 hover:bg-success/10"
                onClick={() =>
                  clearMutation.mutate(technicianId, { onSuccess: () => void refetch() })
                }
                disabled={clearMutation.isPending}
              >
                <CircleCheck className="size-3 mr-1" />
                Mark Available Now
              </Button>
            </>
          ) : (
            <Button size="xs" variant="outline" className="text-xs" onClick={() => setIsDialogOpen(true)}>
              <Ban className="size-3 mr-1" />
              Mark Unavailable
            </Button>
          )}
        </div>
      </CardContent>
      <SetUnavailabilityDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        technicianId={technicianId}
        technicianName="you"
        currentUnavailableUntil={availability?.unavailableUntil ?? null}
      />
    </Card>
  );
}

export function ProfilePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isMock = isMockEnabled();
  const activeSessionId = getActiveSessionId();

  // Basic Details Edit State (Mocks)
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState("+1 (555) 019-2834");

  const { data: sessions = [], isLoading, error } = useQuery<Session[]>({
    queryKey: ["auth", "sessions"],
    queryFn: () => {
      if (isMock) {
        return mockAdapters.auth.getSessions();
      }
      return authApi.getSessions();
    },
  });

  const revokeMutation = useMutation({
    mutationFn: (sessionId: string) => {
      if (isMock) {
        return mockAdapters.auth.revokeSession(sessionId);
      }
      return authApi.revokeSession(sessionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
      toast.success("Device session revoked successfully.");
    },
  });

  const revokeAllMutation = useMutation({
    mutationFn: () => {
      if (isMock) {
        return mockAdapters.auth.logoutAll();
      }
      return authApi.logoutAll();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "sessions"] });
      toast.success("Other active device sessions revoked.");
    },
  });

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profile basic settings updated (simulated).");
  };

  return (
    <ProfileTemplate
      user={user}
      sessions={sessions}
      activeSessionId={activeSessionId}
      onRevokeSession={(id) => revokeMutation.mutate(id)}
      onRevokeAll={() => revokeAllMutation.mutate()}
      isRevoking={revokeMutation.isPending}
      isRevokingAll={revokeAllMutation.isPending}
      isSessionsLoading={isLoading}
      sessionsError={error ? error.message : null}
    >
      {user?.role === "TECHNICIAN" && (
        <div className="mb-4">
          <MyAvailabilityCard technicianId={user.id} />
        </div>
      )}
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">First Name</label>
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="text-xs"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Last Name</label>
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="text-xs"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Phone Number</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="text-xs"
          />
        </div>

        <div className="pt-2">
          <Button type="submit" size="sm" className="text-xs h-8 cursor-pointer">
            Update Settings
          </Button>
        </div>
      </form>
    </ProfileTemplate>
  );
}
export default ProfilePage;
