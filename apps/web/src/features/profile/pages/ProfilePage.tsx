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

const getActiveSessionId = (): string | null => {
  const token = authStore.getAccessToken();
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length === 3) {
      const payload = JSON.parse(atob(parts[1]!));
      return payload.sessionId || null;
    }
  } catch {}
  return null;
};

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
