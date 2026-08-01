import { useState, useEffect } from "react";
import { apiClient } from "../lib/api-client.js";
import { toast } from "sonner";

// Fallback VAPID Public Key in case backend API status fails
const FALLBACK_VAPID_PUBLIC_KEY = "BBSYPwBou8bw2hSYKG6EIVHIsKjlkYmU8z7sedtqK6y9O-A3W17_Jl9KrfzY4rfrG0nGD2bFU7WO5t0YkHc2pCQ";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotification() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>(
    typeof window !== "undefined" && "Notification" in window
      ? Notification.permission
      : "default"
  );
  
  const [isSupported] = useState<boolean>(
    typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window
  );

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    checkSubscriptionStatus();
  }, []);

  /**
   * Check if user is currently registered for web push on this device.
   */
  const checkSubscriptionStatus = async () => {
    if (!isSupported) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (err) {
      console.warn("[usePushNotification] Error checking subscription status:", err);
    }
  };

  /**
   * Request user permission to display alerts.
   */
  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) {
      return "denied";
    }

    const result = await Notification.requestPermission();
    setPermissionStatus(result);
    return result;
  };

  /**
   * Create browser web push subscription and sync authentication keys with backend.
   */
  const subscribe = async () => {
    if (!isSupported) {
      toast.error("Browser Push notifications are not supported on this device.");
      return;
    }

    setIsPending(true);
    try {
      // 1. Force permission check
      const permResult = await requestPermission();
      if (permResult !== "granted") {
        toast.error("Alert permission denied. Change your browser settings to enable notifications.");
        setIsPending(false);
        return;
      }

      // 2. Fetch the dynamic VAPID public key from backend status endpoint
      let vapidKey = FALLBACK_VAPID_PUBLIC_KEY;
      try {
        const statusRes = await apiClient.get("/push/status");
        if (statusRes.data?.data?.publicKey) {
          vapidKey = statusRes.data.data.publicKey;
        }
      } catch (err) {
        console.warn("[usePushNotification] Could not fetch VAPID key from status endpoint, using fallback:", err);
      }

      // 3. Subscribe to browser push gateway
      const registration = await navigator.serviceWorker.ready;
      const applicationServerKey = urlBase64ToUint8Array(vapidKey);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });

      // Format credentials mapping Zod specifications
      const subscriptionJSON = subscription.toJSON();
      const payload = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscriptionJSON.keys?.p256dh || "",
          auth: subscriptionJSON.keys?.auth || "",
        },
      };

      // 4. Send subscription details to backend
      await apiClient.post("/push/subscribe", payload);

      setIsSubscribed(true);
      toast.success("Device registered successfully for push notifications.");
    } catch (err: any) {
      console.error("[usePushNotification] Subscription failed:", err);
      toast.error("Failed to register browser push notifications.");
    } finally {
      setIsPending(false);
    }
  };

  /**
   * Deregister push notifications.
   */
  const unsubscribe = async () => {
    if (!isSupported) return;

    setIsPending(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 1. Delete subscription keys on backend
        await apiClient.delete("/push/unsubscribe", {
          data: { endpoint: subscription.endpoint },
        });

        // 2. Call browser opt-out
        await subscription.unsubscribe();
      }

      setIsSubscribed(false);
      toast.success("Push notifications disabled successfully.");
    } catch (err: any) {
      console.error("[usePushNotification] Unsubscription failed:", err);
      toast.error("Failed to disable browser push notifications.");
    } finally {
      setIsPending(false);
    }
  };

  return {
    permissionStatus,
    isSupported,
    isSubscribed,
    isPending,
    subscribe,
    unsubscribe,
  };
}
export default usePushNotification;
