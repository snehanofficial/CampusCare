# PWA.md
## CampusCare — Progressive Web Application Architecture

> **Status:** Phase 1 Implementation Reference  
> **Stack:** `vite-plugin-pwa@1.3.0` · Workbox · Web App Manifest  
> **Strategy:** Network-first for API, Cache-first for static assets

---

## 1. Purpose

CampusCare is designed as a Mobile-First PWA to enable:
- Home screen installation on Android and iOS
- Offline access to recent/cached data
- Native-like performance on mobile networks
- Push notification delivery (Phase 3)
- Background sync for offline form submissions (Phase 3)

Phase 1 establishes the PWA foundation (manifest, service worker, installability). Business-logic offline behaviors are added in later phases.

---

## 2. `vite.config.ts` PWA Configuration

```typescript
// apps/web/vite.config.ts
import { VitePWA } from "vite-plugin-pwa";

VitePWA({
  registerType: "autoUpdate",

  // Service worker strategy
  strategies: "generateSW",  // Let Workbox generate the SW (simpler, correct for Phase 1)

  // Development mode: show SW in dev
  devOptions: {
    enabled: true,
    type: "module",
  },

  // Web App Manifest
  manifest: {
    name: "CampusCare ITSM Portal",
    short_name: "CampusCare",
    description: "Campus Help Desk & IT Service Management Platform",
    start_url: "/dashboard",
    display: "standalone",
    orientation: "portrait-primary",
    theme_color: "#3b82f6",        // blue-500 — must match design system primary
    background_color: "#ffffff",   // Light mode background
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",  // Adaptive icons on Android
      },
    ],
    screenshots: [
      {
        src: "/screenshots/dashboard-desktop.png",
        sizes: "1280x800",
        type: "image/png",
        form_factor: "wide",
      },
      {
        src: "/screenshots/dashboard-mobile.png",
        sizes: "390x844",
        type: "image/png",
        form_factor: "narrow",
      },
    ],
    shortcuts: [
      {
        name: "New Ticket",
        url: "/tickets/new",
        description: "Submit a new support ticket",
        icons: [{ src: "/icons/shortcut-ticket.png", sizes: "96x96" }],
      },
    ],
    categories: ["productivity", "utilities"],
    lang: "en",
  },

  // Workbox cache strategies
  workbox: {
    // Pre-cache all static assets (JS, CSS, fonts, icons)
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],

    // Runtime caching rules
    runtimeCaching: [
      // API calls: Network-first (fresh data preferred, cache as fallback)
      {
        urlPattern: ({ url }) => url.pathname.startsWith("/api/v1"),
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 5 * 60, // 5 minutes
          },
          networkTimeoutSeconds: 10,
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      // Static assets: Cache-first (build artifacts don't change)
      {
        urlPattern: ({ request }) => request.destination === "image",
        handler: "CacheFirst",
        options: {
          cacheName: "image-cache",
          expiration: {
            maxEntries: 200,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
          },
        },
      },
      // Google Fonts (if used)
      {
        urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com",
        handler: "StaleWhileRevalidate",
        options: {
          cacheName: "google-fonts-stylesheets",
        },
      },
    ],

    // Fallback to offline page when network fails
    offlineFallback: "/offline",
    navigateFallback: "/index.html", // SPA fallback
    navigateFallbackDenylist: [/^\/api/], // Don't fallback for API routes
  },
})
```

---

## 3. Service Worker Lifecycle

### Auto-Update Strategy

`registerType: "autoUpdate"` means:
1. A new service worker is installed immediately when deployed
2. On the next page load (not immediately), the new SW takes over
3. No "Update available" prompt needed — the update is silent

**Why autoUpdate?** CampusCare is an enterprise app, not a public consumer app. Users are expected to be online most of the time. Auto-updates ensure users always run the latest version without confusion.

### SW Registration

`vite-plugin-pwa` handles SW registration automatically. In development mode, the SW is registered to verify offline behavior works.

---

## 4. Offline Strategy

### Phase 1 (Foundation)

| Resource | Strategy | Rationale |
|:---|:---|:---|
| App shell (HTML/JS/CSS) | Cache-first via pre-cache | Shell never changes mid-session |
| API data | Network-first, 5min cache | Fresh data preferred; cached as fallback |
| Images | Cache-first, 30-day TTL | Avatars, icons rarely change |
| Static assets | Cache-first | Build artifacts are versioned |

### Phase 1 Offline UX

When the user is offline:
- **Dashboard:** Shows last cached data with an "Offline" banner
- **Ticket creation:** Displays an offline warning (Phase 3: offline queue)
- **Navigation:** All pre-cached routes work offline
- **API-dependent content:** Shows a "No internet connection" empty state

---

## 5. Offline Page

Create a static offline fallback page:

```html
<!-- public/offline.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>CampusCare — Offline</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: #f8fafc;
      color: #0f172a;
      text-align: center;
      padding: 1rem;
    }
    h1 { font-size: 1.5rem; font-weight: 600; }
    p { color: #64748b; margin-top: 0.5rem; }
    button {
      margin-top: 1.5rem;
      padding: 0.625rem 1.25rem;
      background: #3b82f6;
      color: white;
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <h1>You are offline</h1>
  <p>CampusCare requires an internet connection.<br />Please check your network and try again.</p>
  <button onclick="window.location.reload()">Try Again</button>
</body>
</html>
```

---

## 6. PWA Icons

Required icons must be in `apps/web/public/icons/`:

| File | Size | Purpose |
|:---|:---|:---|
| `icon-192.png` | 192×192 | Android home screen |
| `icon-512.png` | 512×512 | Splash screen, high-DPI |
| `icon-512-maskable.png` | 512×512 | Adaptive icon (Android) |
| `shortcut-ticket.png` | 96×96 | App shortcut icon |
| `apple-touch-icon.png` | 180×180 | iOS home screen |
| `favicon.ico` | 32×32 | Browser tab |

Add to `index.html`:
```html
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="CampusCare" />
```

---

## 7. Install Prompt Hook

```typescript
// hooks/usePwaInstall.ts
interface UsePwaInstallReturn {
  isInstallable: boolean;
  install: () => Promise<void>;
  isDismissed: boolean;
  dismiss: () => void;
}

export function usePwaInstall(): UsePwaInstallReturn {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useLocalStorage("pwa-install-dismissed", false);

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  const install = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") setPrompt(null);
  };

  return {
    isInstallable: !!prompt && !isDismissed,
    install,
    isDismissed,
    dismiss: () => setIsDismissed(true),
  };
}
```

---

## 8. Update Notification Hook

```typescript
// hooks/usePwaUpdate.ts
import { useRegisterSW } from "virtual:pwa-register/react";

export function usePwaUpdate() {
  const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW({
    onRegistered(r) {
      // SW registered
    },
    onRegisterError(error) {
      console.error("SW registration error", error);
    },
  });

  return { needRefresh, updateServiceWorker };
}
```

---

## 9. Push Notifications (Phase 3 Scaffold)

The backend already has `web-push` installed. Phase 1 adds the VAPID key infrastructure:

```typescript
// Backend: services/push-notification.service.ts (scaffolded, not active in Phase 1)
// Frontend: hooks/usePushNotifications.ts (scaffolded, not active in Phase 1)

// VAPID keys generated via:
// node -e "const wp = require('web-push'); console.log(wp.generateVAPIDKeys());"
// Add to .env:
// VAPID_PUBLIC_KEY=...
// VAPID_PRIVATE_KEY=...
```

---

## 10. Lighthouse PWA Score Targets

Phase 1 must achieve:
- **Performance:** ≥ 90
- **Accessibility:** ≥ 95
- **Best Practices:** ≥ 95
- **PWA:** All core checks passing
  - ✓ Installable
  - ✓ Registers service worker
  - ✓ Responds with 200 when offline
  - ✓ Has a `<meta name="viewport">`
  - ✓ Has icons of the appropriate sizes

---

## 11. Development vs. Production Behavior

| Feature | Development | Production |
|:---|:---|:---|
| Service Worker | Active (enabled in devOptions) | Active |
| Cache | Minimal / cleared on reload | Full Workbox cache |
| Install prompt | May not appear (localhost) | Appears on HTTPS |
| Push notifications | Not active (Phase 1) | Not active (Phase 1) |

---

## 12. Future Extensibility

- **Background Sync:** Queue ticket submissions when offline, send when back online (Phase 3)
- **Push Notifications:** Use `web-push` VAPID keys already in backend; subscribe users in Phase 3
- **Offline Data Store:** Consider IndexedDB for storing drafts and critical reference data offline
- **Periodic Background Sync:** Refresh notification count in the background every 5 minutes
