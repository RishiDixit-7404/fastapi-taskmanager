import {
  BarChart3,
  FolderKanban,
  KeyRound,
  LogOut,
  Moon,
  Shield,
  Sun,
  Tags,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { logoutUser } from "../../api/auth";
import { getApiErrorMessage } from "../../api/client";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { to: "/projects", label: "Projects", icon: FolderKanban },
  { to: "/tags", label: "Tags", icon: Tags },
  { to: "/api-keys", label: "API Keys", icon: KeyRound },
];

const titles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/projects": "Projects",
  "/tags": "Tags",
  "/api-keys": "API Keys",
  "/admin": "Admin",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, isAdmin, refreshToken, clearAuth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [dark, setDark] = useState(() => {
    const stored = localStorage.getItem("tm-dark");
    if (stored !== null) return stored === "true";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("tm-dark", String(dark));
  }, [dark]);

  async function handleLogout() {
    if (refreshToken) {
      try {
        await logoutUser(refreshToken);
      } catch (error) {
        toast.error(getApiErrorMessage(error, "Logout failed on server"));
      }
    }
    clearAuth();
    navigate("/login", { replace: true });
  }

  const pageTitle =
    titles[location.pathname] ||
    (location.pathname.startsWith("/projects/") ? "Project detail" : undefined) ||
    (location.pathname.startsWith("/tasks/") ? "Task detail" : "Task Manager");

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="hidden border-r bg-card lg:block">
        <div className="flex h-16 items-center border-b px-6 text-lg font-bold">Task Manager</div>
        <nav className="space-y-1 p-4">
          {navItems.map((item) => (
            <ShellLink key={item.to} {...item} />
          ))}
          {isAdmin ? <ShellLink to="/admin" label="Admin" icon={Shield} /> : null}
        </nav>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Workspace</p>
              <h1 className="text-xl font-semibold">{pageTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                className="h-9 w-9 px-0"
                onClick={() => setDark((value) => !value)}
                aria-label="Toggle dark mode"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <div className="hidden text-right text-sm sm:block">
                <div className="font-medium">{user?.full_name}</div>
                <div className="text-muted-foreground">{user?.role}</div>
              </div>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t px-4 py-2 lg:hidden">
            {navItems.map((item) => (
              <MobileLink key={item.to} {...item} />
            ))}
            {isAdmin ? <MobileLink to="/admin" label="Admin" icon={Shield} /> : null}
          </nav>
        </header>
        <main className="page-shell">{children}</main>
      </div>
    </div>
  );
}

function ShellLink({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition ${
          isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}

function MobileLink({ to, label, icon: Icon }: { to: string; label: string; icon: LucideIcon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
          isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
        }`
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </NavLink>
  );
}
