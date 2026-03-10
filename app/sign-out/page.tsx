"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebaseAuth";

export default function SignOutPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Signing you out...");

  useEffect(() => {
    const doSignOut = async () => {
      if (!isFirebaseConfigured || !auth) {
        setMessage("Firebase Auth is not configured.");
        return;
      }

      try {
        await signOut(auth);
        setMessage("Signed out successfully. Redirecting...");
        window.setTimeout(() => router.replace("/"), 700);
      } catch {
        setMessage("Could not sign out. Please try again.");
      }
    };

    void doSignOut();
  }, [router]);

  return (
    <main className="min-h-dvh bg-[#fdfaf6] px-4 py-8 text-slate-900">
      <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#7b1113]">Sign out</h1>
        <p className="mt-2 text-sm text-slate-600">{message}</p>
        <Link href="/" className="mt-4 inline-block text-xs font-semibold text-slate-700">
          Return to map
        </Link>
      </div>
    </main>
  );
}
