import React from "react";
import ReactDOM from "react-dom/client";
import { AuthProvider } from "./auth/AuthContext";
import { AppRouter } from "./app/router";
import { AppProviders } from "./app/providers";
import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </AppProviders>
  </React.StrictMode>,
);


