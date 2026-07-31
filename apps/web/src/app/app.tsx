import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router";
import { Toaster } from "sonner";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground">
                <h1 className="text-3xl font-bold text-primary">CampusCare Help Desk & ITSM</h1>
                <p className="mt-2 text-muted-foreground">Mobile-First Progressive Web Application</p>
              </div>
            }
          />
          <Route
            path="*"
            element={
              <div className="flex h-screen items-center justify-center bg-background text-foreground">
                <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
              </div>
            }
          />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" richColors />
    </QueryClientProvider>
  );
}
