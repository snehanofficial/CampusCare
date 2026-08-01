import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notificationRepository } from "../../../lib/repositories/notification.repository.js";
import { Switch } from "../../../components/ui/switch.js";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../components/ui/card.js";
import { Button } from "../../../components/ui/button.js";
import { toast } from "sonner";
import { Mail, Bell, Smartphone, Shield, AlertTriangle, CheckCircle2 } from "lucide-react";
import { PushNotificationService } from "../../notifications/push/push-notification.service.js";

export function NotificationPreferencesSettings() {
  const queryClient = useQueryClient();

  const [pushSupported, setPushSupported] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission | "unsupported">("default");
  const [isPushEnabled, setIsPushEnabled] = useState(false);
  const [loadingPushStatus, setLoadingPushStatus] = useState(true);
  const [isTogglingPush, setIsTogglingPush] = useState(false);
  const [vapidPublicKey, setVapidPublicKey] = useState("");

  useEffect(() => {
    const checkStatus = async () => {
      const supported = PushNotificationService.isSupported();
      setPushSupported(supported);
      if (!supported) {
        setPermissionState("unsupported");
        setLoadingPushStatus(false);
        return;
      }

      setPermissionState(Notification.permission);

      try {
        const status = await PushNotificationService.getStatus();
        if (status) {
          setIsPushEnabled(status.isSubscribed);
          setVapidPublicKey(status.publicKey);
        }
      } catch (err) {
        console.error("Failed to check push status:", err);
      } finally {
        setLoadingPushStatus(false);
      }
    };

    checkStatus();
  }, []);

  const handleEnablePush = async () => {
    setIsTogglingPush(true);
    try {
      const permission = await PushNotificationService.requestPermission();
      setPermissionState(permission);

      if (permission === "granted") {
        let key = vapidPublicKey;
        if (!key) {
          const status = await PushNotificationService.getStatus();
          if (status) {
            setVapidPublicKey(status.publicKey);
            key = status.publicKey;
          }
        }
        if (key) {
          await PushNotificationService.subscribeDevice(key);
          setIsPushEnabled(true);
          toast.success("Browser notifications enabled successfully!");
        } else {
          throw new Error("Could not retrieve VAPID public key from server");
        }
      } else if (permission === "denied") {
        toast.error("Notifications blocked. Enable from browser settings.");
      }
    } catch (err: any) {
      toast.error(`Subscription failed: ${err.message || err}`);
    } finally {
      setIsTogglingPush(false);
    }
  };

  const handleDisablePush = async () => {
    setIsTogglingPush(true);
    try {
      await PushNotificationService.unsubscribeDevice();
      setIsPushEnabled(false);
      toast.success("Browser notifications disabled.");
    } catch (err: any) {
      toast.error(`Unsubscription failed: ${err.message || err}`);
    } finally {
      setIsTogglingPush(false);
    }
  };

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: () => notificationRepository.getPreferences(),
  });

  const mutation = useMutation({
    mutationFn: (updates: Array<{ category: string; email: boolean; inApp: boolean; push: boolean }>) =>
      notificationRepository.updatePreferences(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] });
      toast.success("Notification configurations saved successfully.");
    },
    onError: (err: any) => {
      toast.error(`Error saving preferences: ${err.message || err}`);
    },
  });

  const handleToggle = (category: string, channel: "email" | "inApp" | "push", currentValue: boolean) => {
    if (!preferences) return;

    const updated = preferences.map((p) => {
      if (p.category === category) {
        return {
          category: p.category,
          email: channel === "email" ? !currentValue : p.email,
          inApp: channel === "inApp" ? !currentValue : p.inApp,
          push: channel === "push" ? !currentValue : p.push,
        };
      }
      return {
        category: p.category,
        email: p.email,
        inApp: p.inApp,
        push: p.push,
      };
    });

    mutation.mutate(updated);
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat?.toUpperCase()) {
      case "TICKET":
        return "Support Tickets (Updates & Assignments)";
      case "INCIDENT":
        return "Critical Incidents & Outages";
      case "ASSET":
        return "Asset Allocations & Log History";
      case "MAINTENANCE":
        return "Scheduled Preventative Maintenance";
      case "INVENTORY":
        return "Inventory Alerts (Low Stock warnings)";
      case "SLA":
        return "SLA policies threshold warnings";
      case "SYSTEM":
        return "Global System Announcements";
      default:
        return cat;
    }
  };

  if (isLoading) {
    return <div className="text-xs text-muted-foreground p-6">Loading notification matrices...</div>;
  }

  if (error) {
    return <div className="text-xs text-destructive p-6 font-semibold">Error syncing preferences: {error.message}</div>;
  }

  return (
    <>
      <Card className="border border-border bg-card">
        <CardHeader className="border-b border-border/40 py-4 px-6">
          <CardTitle className="text-sm font-bold text-foreground">Notification Preference Settings</CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-normal mt-0.5">
            Select your target delivery dispatch channels per notification module category.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-border/30 bg-muted/10">
                  <th className="text-[10px] font-bold text-muted-foreground uppercase p-4">Category Profile</th>
                  <th className="text-[10px] font-bold text-muted-foreground uppercase p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Bell className="size-3 text-muted-foreground" />
                      <span>In-App Feed</span>
                    </div>
                  </th>
                  <th className="text-[10px] font-bold text-muted-foreground uppercase p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Mail className="size-3 text-muted-foreground" />
                      <span>Email Dispatch</span>
                    </div>
                  </th>
                  <th className="text-[10px] font-bold text-muted-foreground uppercase p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Smartphone className="size-3 text-muted-foreground" />
                      <span>Web Push</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {preferences?.map((pref) => (
                  <tr key={pref.category} className="hover:bg-muted/5 transition-colors">
                    <td className="p-4">
                      <span className="text-xs font-semibold text-foreground">
                        {getCategoryLabel(pref.category)}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={pref.inApp}
                          onCheckedChange={() => handleToggle(pref.category, "inApp", pref.inApp)}
                          disabled={mutation.isPending}
                        />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={pref.email}
                          onCheckedChange={() => handleToggle(pref.category, "email", pref.email)}
                          disabled={mutation.isPending}
                        />
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center">
                        <Switch
                          checked={pref.push}
                          onCheckedChange={() => handleToggle(pref.category, "push", pref.push)}
                          disabled={mutation.isPending}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Browser Notifications Permission Card */}
      <Card className="border border-border bg-card mt-4" id="browser-push-card">
        <CardHeader className="border-b border-border/40 py-4 px-6">
          <CardTitle className="text-sm font-bold text-foreground flex items-center gap-2">
            <Smartphone className="size-4 text-primary" />
            <span>Browser Push Notifications</span>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground leading-normal mt-0.5">
            Receive real-time push alerts on your desktop or mobile device, even when the portal is closed.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loadingPushStatus ? (
            <div className="text-xs text-muted-foreground">Checking push notification status...</div>
          ) : permissionState === "unsupported" ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertTriangle className="size-4 shrink-0" />
              <p>Push notifications are not supported by this browser or in incognito mode.</p>
            </div>
          ) : permissionState === "denied" ? (
            <div className="flex flex-col gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <div className="flex items-center gap-3">
                <AlertTriangle className="size-4 shrink-0" />
                <p className="font-semibold">Notifications blocked</p>
              </div>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Notifications are blocked for this site. Please reset notification permissions in your browser address bar settings to allow alerts.
              </p>
            </div>
          ) : isPushEnabled && permissionState === "granted" ? (
            <div className="flex items-center justify-between p-4 rounded-lg bg-success/10 border border-success/20 text-success-foreground text-xs">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-success shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">✓ Notifications enabled</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">This device is registered to receive alerts.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDisablePush}
                disabled={isTogglingPush}
                className="text-xs border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                Disable Notifications
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/20 border border-border/40 text-xs">
              <div className="pr-4">
                <p className="font-semibold text-foreground">Enable Browser Notifications</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Receive alerts when tickets are created, assigned or updated.</p>
              </div>
              <Button
                onClick={handleEnablePush}
                disabled={isTogglingPush}
                className="text-xs h-8 px-4 cursor-pointer font-semibold bg-primary hover:bg-primary/95 text-primary-foreground shrink-0"
              >
                {isTogglingPush ? "Enabling..." : "Enable Notifications"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
export default NotificationPreferencesSettings;
