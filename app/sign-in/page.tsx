"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db, isFirebaseConfigured } from "../lib/firebaseAuth";
import { ensureAdminRole } from "../lib/userRoles";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace("/");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const onEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!auth) {
      setErrorMessage("Firebase Auth is not configured yet.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      if (db) {
        await ensureAdminRole(db, credential.user.uid, credential.user.email);
      }
      router.replace("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Authentication failed.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-dvh bg-[#fdfaf6] px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#7b1113]">Welcome to IskoLibMap</h1>
        <p className="mt-1 text-sm text-slate-600">Sign in with email and password.</p>

        {!isFirebaseConfigured && (
          <p className="mt-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Firebase env vars are missing. Add `NEXT_PUBLIC_FIREBASE_*` values in
            your environment before using auth.
          </p>
        )}

        <form onSubmit={onEmailSubmit} className="mt-4 space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#7b1113] focus:bg-white"
            />
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-[#7b1113] focus:bg-white"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting || !isFirebaseConfigured}
            className="h-10 w-full rounded-lg bg-[#7b1113] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Please wait..." : "Sign in"}
          </button>
        </form>

        {errorMessage && (
          <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700">
            {errorMessage}
          </p>
        )}

        <div className="mt-4 text-xs text-slate-500">
          <Link href="/" className="font-semibold text-slate-700">
            Back to map
          </Link>
        </div>
      </div>
    </main>
  );
}
