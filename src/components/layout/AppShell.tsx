import React from "react";
import { Link, Outlet } from "react-router-dom";
import { LogIn, LogOut, Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/theme";
import { useAuth } from "@/auth/AuthContext";
import { cn } from "@/lib/utils";

type AppShellProps = {
  title?: string;
  className?: string;
};

export function AppShell({ title = "Lịch làm việc", className }: AppShellProps) {
  const { theme, toggleTheme } = useTheme();
  const { currentUser, logout } = useAuth();

  return (
    <div className={cn("min-h-dvh bg-[var(--color-bg)] text-[var(--color-text-primary)]", className)}>
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[color-mix(in_srgb,var(--color-bg)_92%,transparent)] backdrop-blur supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--color-bg)_72%,transparent)]">
        <div className="mx-auto flex h-12 max-w-3xl items-center gap-2 px-3 sm:h-14 sm:px-4">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-semibold tracking-[-0.01em] sm:text-base">{title}</h1>
          </div>

          <nav className="flex items-center gap-1">
            {currentUser ? (
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm transition hover:shadow"
                aria-label="Đăng xuất"
                title="Đăng xuất"
              >
                <LogOut className="h-4 w-4" />
              </button>
            ) : (
              <Link
                to="/login"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm transition hover:shadow"
                aria-label="Đăng nhập"
                title="Đăng nhập"
              >
                <LogIn className="h-4 w-4" />
              </Link>
            )}

            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-text-primary)] shadow-sm transition hover:shadow"
              aria-label={theme === "dark" ? "Chuyển sang chế độ sáng" : "Chuyển sang chế độ tối"}
              title={theme === "dark" ? "Light mode" : "Dark mode"}
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </nav>
        </div>
      </header>

      {/* Main scroll container (important for virtualization in legacy schedule page) */}
      <main
        id="app-scroll"
        className="mx-auto h-[calc(100dvh-3rem)] max-w-3xl overflow-y-auto px-3 py-3 sm:h-[calc(100dvh-3.5rem)] sm:px-4 sm:py-4"
      >
        <Outlet />
      </main>
    </div>
  );
}


