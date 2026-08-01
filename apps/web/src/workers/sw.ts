/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare const self: ServiceWorkerGlobalScope & typeof globalThis;

// Precache static assets compiled by Vite (Workbox injection target)
precacheAndRoute((self as any).__WB_MANIFEST || []);

// 1. Capture incoming Web Push events from browser service worker
self.addEventListener("push", (event) => {
  if (!event.data) {
    console.debug("[ServiceWorker] Received push event with no data payload");
    return;
  }

  try {
    const payload = event.data.json();
    
    // Support the requested typed payload properties:
    // { title, message, icon, url, category, priority, timestamp }
    const title = payload.title || "CampusCare Notification";
    const options: any = {
      body: payload.message || "",
      icon: payload.icon || "/icon-192.png", // Fallback to public icon
      badge: "/icon-192.png",
      vibrate: [100, 50, 100],
      timestamp: payload.timestamp || Date.now(),
      data: {
        url: payload.url || "/dashboard",
        category: payload.category || "SYSTEM",
        priority: payload.priority || "MEDIUM",
      },
      actions: [
        { action: "view", title: "View" },
        { action: "dismiss", title: "Dismiss" },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    console.error("[ServiceWorker] Error processing push payload data:", err);
  }
});

// 2. Capture clicks on OS-level notification alerts
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Handle explicit "dismiss" actions
  if (event.action === "dismiss") {
    return;
  }

  const actionUrl = event.notification.data?.url || "/dashboard";

  // Resolve target url and redirect/focus client tabs
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        // Search for existing tab that is already open
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.navigate(actionUrl).then((c) => c?.focus());
          }
        }
        
        // Open a new tab if no window is active
        if (self.clients.openWindow) {
          return self.clients.openWindow(actionUrl);
        }
        return null;
      })
  );
});

// 3. Background Sync event listener
self.addEventListener("sync", (event: any) => {
  if (event.tag === "sync-offline-queue") {
    console.info("[ServiceWorker] Network recovery detected. Triggering sync replayer.");
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: "TRIGGER_SYNC" });
        });
      })
    );
  }
});
