"use client";

import { useAuth } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, ReactNode } from "react";
import Link from "next/link";
import { Spinner } from "@/components/ui";

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    roles: ["admin", "procurement_officer", "approver"],
  },
  {
    href: "/vendors",
    label: "Vendors",
    roles: ["admin", "procurement_officer"],
  },
  { href: "/rfq", label: "RFQs", roles: ["admin", "procurement_officer"] },
  {
    href: "/quotations",
    label: "Quotations",
    roles: ["admin", "procurement_officer", "approver", "vendor"],
  },
  {
    href: "/po",
    label: "Purchase orders",
    roles: ["admin", "procurement_officer", "approver", "vendor"],
  },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, accessToken, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !accessToken) {
      router.push("/login");
    }
  }, [isLoading, accessToken, router]);

  if (isLoading || !accessToken) {
    return (
      <div
        className="app-shell"
        style={{ alignItems: "center", justifyContent: "center" }}
      >
        <Spinner label="Loading workspace…" />
      </div>
    );
  }

  const filteredNav = navItems.filter((item) =>
    item.roles.includes(user?.role || ""),
  );

  const handleLogout = async () => {
    await logout();
    router.push("/login").catch(() => {});
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-logo">PF</div>
          <div>
            <div className="sidebar-brand-title">ProcureFlow</div>
            <div className="sidebar-brand-subtitle">Procurement OS</div>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Primary navigation">
          <ul>
            {filteredNav.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`nav-link ${active ? "nav-link-active" : ""}`}
                  >
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-user">
          <p className="sidebar-user-name">{user?.name || "Workspace user"}</p>
          <p className="sidebar-user-role">
            {user?.role?.replace("_", " ") || "authenticated"}
          </p>
          <button
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ width: "100%" }}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="app-main">{children}</main>
    </div>
  );
}
