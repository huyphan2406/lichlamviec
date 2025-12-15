import React from "react";
import { ThemeProvider } from "./theme";
import { Toaster } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster
        richColors
        position="top-center"
        toastOptions={{
          style: {
            border: "1px solid var(--color-border)",
            background: "var(--color-card)",
            color: "var(--color-text-primary)",
          },
        }}
      />
    </ThemeProvider>
  );
}


