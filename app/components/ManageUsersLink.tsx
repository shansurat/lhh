"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../lib/firebaseAuth";
import { getUserRole } from "../lib/userRoles";

type ManageUsersLinkProps = {
  compact?: boolean;
};

export default function ManageUsersLink({ compact = false }: ManageUsersLinkProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!auth || !db) {
      setShow(false);
      return;
    }

    const firestore = db;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setShow(false);
        return;
      }

      const role = await getUserRole(firestore, user.uid);
      setShow(role === "superadmin");
    });

    return () => unsubscribe();
  }, []);

  if (!show) {
    return null;
  }

  if (compact) {
    return (
      <Link
        href="/admin"
        className="h-8 w-8 text-slate-600 flex items-center justify-center"
        aria-label="Admin"
        title="Admin"
      >
        <Shield className="size-4" />
      </Link>
    );
  }

  return (
    <Link
      href="/admin"
      className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50"
    >
      <Shield className="size-3.5" />
      <span>Admin</span>
    </Link>
  );
}
