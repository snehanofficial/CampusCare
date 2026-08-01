import { registerSW } from "virtual:pwa-register";
import { apiClient } from "../../../lib/api-client.js";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export class PushNotificationService {
  /**
   * Check if browser supports Service Worker, PushManager & Notification API.
   */
  static isSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window
    );
  }

  /**
   * Get current push subscription status and VAPID public key from backend.
   */
  static async getStatus() {
    const response = await apiClient.get<any>("/push/status");
    return response.data?.data;
  }

  /**
   * Request notification permission from the browser.
   */
  static async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return "denied";
    if (Notification.permission === "granted") return "granted";
    return await Notification.requestPermission();
  }

  /**
   * Subscribe user device to push notifications.
   */
  static async subscribeDevice(publicKey: string): Promise<boolean> {
    try {
      if (!this.isSupported()) {
        throw new Error("Push notifications are not supported in this browser");
      }

      // 1. Wipe out any stale service worker registrations left over from earlier
      // (broken) attempts on this origin/scope. A leftover registration whose
      // pushManager subscription is pinned to an old/rotated VAPID key is what
      // makes Chrome throw "AbortError: Registration failed - push service error"
      // when we try to subscribe with the current key.
      const staleRegistrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(staleRegistrations.map((r) => r.unregister()));

      // 2. Register a fresh service worker via vite-plugin-pwa (resolves the
      // correct SW URL/type for both dev and prod builds instead of hardcoding /sw.js)
      registerSW({ immediate: true });
      const registration = await navigator.serviceWorker.ready;

      // 3. Subscribe with VAPID key, with one retry that force-clears the
      // registration again if the push service still reports a conflict.
      const subscribeOnce = () =>
        registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

      let subscription: PushSubscription;
      try {
        subscription = await subscribeOnce();
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          const stale = await registration.pushManager.getSubscription();
          if (stale) await stale.unsubscribe();
          subscription = await subscribeOnce();
        } else {
          throw err;
        }
      }

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Subscription object is missing critical keys");
      }

      // 5. Send subscription object to backend
      const response = await apiClient.post("/push/subscribe", {
        endpoint: subJson.endpoint,
        keys: {
          p256dh: subJson.keys.p256dh,
          auth: subJson.keys.auth,
        },
      });

      return !!response.data?.success;
    } catch (error) {
      console.error("[PushNotificationService] Failed to subscribe device:", error);
      throw error;
    }
  }

  /**
   * Unsubscribe user device from push notifications.
   */
  static async unsubscribeDevice(): Promise<boolean> {
    try {
      if (!this.isSupported()) return false;

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        // 1. Tell backend to delete subscription
        await apiClient.delete("/push/unsubscribe", {
          data: { endpoint: subscription.endpoint },
        });

        // 2. Unsubscribe locally
        await subscription.unsubscribe();
      }

      return true;
    } catch (error) {
      console.error("[PushNotificationService] Failed to unsubscribe device:", error);
      throw error;
    }
  }
}
export default PushNotificationService;
