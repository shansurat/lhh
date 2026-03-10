"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Shield, Map, LogOut } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, isFirebaseConfigured } from "../lib/firebaseAuth";
import { getUserRole, type UserRole } from "../lib/userRoles";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin", "superadmin"] as UserRole[],
  },
  {
    href: "/admin/users",
    label: "Manage users",
    icon: Shield,
    roles: ["superadmin"] as UserRole[],
  },
  {
    href: "/",
    label: "Back to map",
    icon: Map,
    roles: ["admin", "superadmin"] as UserRole[],
  },
  {
    href: "/sign-out",
    label: "Sign out",
    icon: LogOut,
    roles: ["admin", "superadmin"] as UserRole[],
  },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (!auth || !db || !isFirebaseConfigured) {
      setRole(null);
      return;
    }

    const firestore = db;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        return;
      }

      const nextRole = await getUserRole(firestore, user.uid);
      setRole(nextRole);
    });

    return () => unsubscribe();
  }, []);

  const visibleItems = navItems.filter((item) =>
    role ? item.roles.includes(role) : item.href !== "/admin/users",
  );

  return (
    <div className="min-h-dvh bg-[#fdfaf6] text-slate-900">
      <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col lg:flex-row">
        <aside className="border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur-sm lg:min-h-dvh lg:w-72 lg:border-r lg:border-b-0 lg:px-5 lg:py-6">
          <div className="mb-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
              IskoLibMap
            </p>
            <h1 className="mt-1 text-xl font-bold text-[#7b1113]">Admin Panel</h1>
            <p className="mt-1 text-xs text-slate-500">
              {role ? (
                <>
                  Signed in as <span className="font-semibold text-slate-700">{role}</span>
                </>
              ) : (
                "Admin tools and shortcuts"
              )}
            </p>
          </div>

          <nav className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    isActive
                      ? "border-[#7b1113] bg-[#7b1113] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
