"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db, isFirebaseConfigured } from "../lib/firebaseAuth";
import { getUserRole, type UserRole } from "../lib/userRoles";

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [role, setRole] = useState<UserRole | null>(null);

  useEffect(() => {
    if (!auth || !db) {
      setIsLoading(false);
      return;
    }

    const firestore = db;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const nextRole = await getUserRole(firestore, user.uid);
        setRole(nextRole);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isFirebaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#7b1113]">Admin</h1>
        <p className="mt-2 text-sm text-slate-600">Firebase env vars are missing.</p>
        <Link href="/" className="mt-4 inline-block text-xs font-semibold text-slate-700">
          Back to map
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-600">Checking permissions...</p>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#7b1113]">Admin</h1>
        <p className="mt-2 text-sm text-slate-600">
          Access denied. Sign in with an admin account first.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/sign-in" className="text-xs font-semibold text-[#7b1113]">
            Sign in
          </Link>
          <Link href="/" className="text-xs font-semibold text-slate-700">
            Back to map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-[#7b1113]">Admin</h1>
      <p className="mt-1 text-sm text-slate-600">
        Signed in as <span className="font-semibold text-slate-800">{role}</span>.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-bold text-slate-800">Map access</h2>
          <p className="mt-1 text-xs text-slate-600">
            Return to the main app and continue managing the library map.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-md bg-[#7b1113] px-3 py-2 text-xs font-semibold text-white"
          >
            Open map
          </Link>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-bold text-slate-800">User management</h2>
          <p className="mt-1 text-xs text-slate-600">
            {role === "superadmin"
              ? "Create new accounts and assign admin or superadmin roles."
              : "Only superadmin can create new user accounts."}
          </p>
          {role === "superadmin" ? (
            <Link
              href="/admin/users"
              className="mt-4 inline-flex rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-white"
            >
              Manage users
            </Link>
          ) : (
            <span className="mt-4 inline-flex rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-400">
              Superadmin only
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
