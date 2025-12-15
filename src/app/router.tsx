import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { SchedulePage } from "@/pages/SchedulePage/SchedulePage";

import { CodeLoginPage } from "@/pages/Auth/CodeLoginPage";
import { AdminPage } from "@/pages/Admin/AdminPage";
import { ProtectedRoute } from "@/auth/ProtectedRoute";

const ContactPage = () => (
  <div className="mx-auto max-w-md">
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-sm">
      <h2 className="text-base font-semibold">Liên hệ mua mã kích hoạt</h2>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Vui lòng liên hệ quản trị viên để mua mã. Sau đó quay lại trang đăng nhập để nhập mã.
      </p>
    </div>
  </div>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<SchedulePage />} />
          <Route path="/login" element={<CodeLoginPage />} />
          <Route path="/register" element={<Navigate to="/login" replace />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}


