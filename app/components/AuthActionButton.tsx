"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebaseAuth";

type AuthActionButtonProps = {
  compact?: boolean;
  className?: string;
};

export default function AuthActionButton({
  compact = false,
  className = "",
}: AuthActionButtonProps) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
    });

    return () => unsubscribe();
  }, []);

  const baseClass = compact
    ? "h-8 w-8 text-slate-600 flex items-center justify-center"
    : "inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600 hover:bg-slate-50";

  if (!isFirebaseConfigured) {
    return (
      <Link
        href="/sign-in"
        className={`${baseClass} ${className}`.trim()}
        aria-label="Sign in"
        title="Sign in"
      >
        <LogIn className="size-4" />
        {!compact && <span>Sign in</span>}
      </Link>
    );
  }

  if (user) {
    return (
      <Link
        href="/sign-out"
        className={`${baseClass} ${className}`.trim()}
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="size-4" />
        {!compact && <span>Sign out</span>}
      </Link>
    );
  }

  return (
    <Link
      href="/sign-in"
      className={`${baseClass} ${className}`.trim()}
      aria-label="Sign in"
      title="Sign in"
    >
      <LogIn className="size-4" />
      {!compact && <span>Sign in</span>}
    </Link>
  );
}
