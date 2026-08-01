import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Sidebar } from "../../components/navigation/Sidebar.js";
import { Navbar } from "../../components/navigation/Navbar.js";
import { Footer } from "../../components/navigation/Footer.js";
import { CommandPalette } from "../../components/navigation/CommandPalette.js";
import { useLocalStorage } from "../../hooks/useLocalStorage.js";
import { useRealtimeNotifications } from "../../hooks/useRealtimeNotifications.js";
import { usePushNotification } from "../../hooks/usePushNotification.js";
import { useOfflineStatus } from "../../hooks/useOfflineStatus.js";
import { SyncManager } from "../../offline/sync/sync.manager.js";

export function AppLayout() {
  // Mount real-time websocket and push subscriptions
  useRealtimeNotifications();
  usePushNotification();
  const { isOffline } = useOfflineStatus();

  // Register listeners for service worker TRIGGER_SYNC messages
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "TRIGGER_SYNC") {
        SyncManager.triggerSync().catch(console.error);
      }
    };
    navigator.serviceWorker?.addEventListener("message", handleServiceWorkerMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener("message", handleServiceWorkerMessage);
    };
  }, []);

  const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>("sidebar-collapsed", false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();

  // Close sidebar on mobile navigation
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Keyboard Accessibility Skip Link */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      {/* Floating Offline Alert Banner */}
      {isOffline && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2.5 rounded-lg border border-destructive bg-destructive/10 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-destructive shadow-lg animate-pulse">
          <span className="h-2 w-2 rounded-full bg-destructive animate-ping" />
          Offline Mode Active (Actions Queued)
        </div>
      )}

      {/* Mobile Drawer Overlay */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-xs lg:hidden transition-all duration-150"
          aria-hidden="true"
        />
      )}

      {/* Persistent Navigation Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMobileMenuToggle={() => setIsMobileOpen((prev) => !prev)} />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 overflow-y-auto p-4 md:p-5 bg-background focus:outline-none"
        >
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>

      <CommandPalette />
    </div>
  );
}
export default AppLayout;
