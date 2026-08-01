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

      // 1. Register service worker
      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
      });
      await navigator.serviceWorker.ready;

      // 2. Subscribe with VAPID Key
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const subJson = subscription.toJSON();
      if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) {
        throw new Error("Subscription object is missing critical keys");
      }

      // 3. Send subscription object to backend
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
