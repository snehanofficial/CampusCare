import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { QueryProvider } from "./providers/QueryProvider.js";
import { ThemeProvider, useTheme } from "./providers/ThemeProvider.js";
import { DensityProvider } from "./providers/DensityProvider.js";
import { AuthProvider } from "../features/auth/store/AuthProvider.js";
import { router } from "./router/router.js";

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
      <DensityProvider>
        <QueryProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </QueryProvider>
      </DensityProvider>
    </ThemeProvider>
  );
}
export default App;
