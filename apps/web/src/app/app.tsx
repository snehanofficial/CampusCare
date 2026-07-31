import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { QueryProvider } from "./providers/QueryProvider.js";
import { ThemeProvider, useTheme } from "./providers/ThemeProvider.js";
import { AuthProvider } from "../features/auth/store/AuthProvider.js";
import { router } from "./router/router.js";

// Inner App to read the active resolvedTheme from ThemeProvider to pass to Toaster
function AppContent() {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors theme={resolvedTheme} />
    </>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
export default App;
