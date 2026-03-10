"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { deleteApp, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
} from "firebase/auth";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import {
  auth,
  db,
  firebaseConfig,
  isFirebaseConfigured,
} from "../../lib/firebaseAuth";
import { getUserRole, type UserRole } from "../../lib/userRoles";

type ProfileRow = {
  uid: string;
  email: string | null;
  role: UserRole;
};

export default function AdminUsersPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [currentUid, setCurrentUid] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("admin");
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [isMutatingUid, setIsMutatingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!auth || !db) {
      setIsLoading(false);
      return;
    }

    const firestore = db;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setIsAuthorized(false);
        setCurrentUid(null);
        setIsLoading(false);
        return;
      }

      try {
        const userRole = await getUserRole(firestore, user.uid);
        setIsAuthorized(userRole === "superadmin");
        setCurrentUid(user.uid);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !isAuthorized) {
      setUsers([]);
      setIsUsersLoading(false);
      return;
    }

    setIsUsersLoading(true);
    const q = query(collection(db, "profiles"), orderBy("email"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const nextUsers: ProfileRow[] = snapshot.docs.map((item) => {
          const data = item.data();
          const nextRole = data.role === "superadmin" ? "superadmin" : "admin";
          return {
            uid: item.id,
            email: typeof data.email === "string" ? data.email : null,
            role: nextRole,
          };
        });
        setUsers(nextUsers);
        setIsUsersLoading(false);
      },
      () => {
        setMessage("Failed to load users.");
        setIsUsersLoading(false);
      },
    );

    return () => unsubscribe();
  }, [isAuthorized]);

  const onCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!db || !currentUid) {
      setMessage("Firebase is not configured.");
      return;
    }

    setMessage(null);
    setIsSubmitting(true);

    const appName = `admin-create-user-${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, appName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
      const credential = await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        password,
      );

      await setDoc(doc(db, "profiles", credential.user.uid), {
        role,
        email,
        createdBy: currentUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      setMessage(`Created account for ${email} as ${role}.`);
      setEmail("");
      setPassword("");
      setRole("admin");
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Failed to create user.";
      setMessage(text);
    } finally {
      await secondaryAuth.signOut();
      await deleteApp(secondaryApp);
      setIsSubmitting(false);
    }
  };

  const onChangeRole = async (uid: string, nextRole: UserRole) => {
    if (!db || !currentUid) {
      setMessage("Firebase is not configured.");
      return;
    }

    setMessage(null);
    setIsMutatingUid(uid);

    try {
      await updateDoc(doc(db, "profiles", uid), {
        role: nextRole,
        updatedAt: serverTimestamp(),
        updatedBy: currentUid,
      });
      setMessage("User role updated.");
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Failed to update role.";
      setMessage(text);
    } finally {
      setIsMutatingUid(null);
    }
  };

  const onDeleteUser = async (uid: string) => {
    if (!db) {
      setMessage("Firebase is not configured.");
      return;
    }

    if (uid === currentUid) {
      setMessage("You cannot delete your own profile.");
      return;
    }

    const target = users.find((item) => item.uid === uid);
    const label = target?.email ?? uid;
    const shouldDelete = window.confirm(
      `Delete ${label}? This removes the profile record and admin access data.`,
    );

    if (!shouldDelete) {
      return;
    }

    setMessage(null);
    setIsMutatingUid(uid);

    try {
      const functions = getFunctions(undefined, "asia-southeast1");
      const deleteAuthUser = httpsCallable<{ uid: string }, { ok: boolean }>(
        functions,
        "deleteAuthUser",
      );

      await deleteAuthUser({ uid });
      setMessage("User account deleted.");
    } catch (error) {
      const text =
        error instanceof Error ? error.message : "Failed to delete user.";
      setMessage(text);
    } finally {
      setIsMutatingUid(null);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#7b1113]">Manage users</h1>
        <p className="mt-2 text-sm text-slate-600">
          Firebase env vars are missing.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-xs font-semibold text-slate-700"
        >
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

  if (!isAuthorized) {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[#7b1113]">Manage users</h1>
        <p className="mt-2 text-sm text-slate-600">
          Access denied. Only superadmin can create users.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block text-xs font-semibold text-slate-700"
        >
          Back to map
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-xl font-bold text-[#7b1113]">Manage users</h1>
      <p className="mt-1 text-sm text-slate-600">
        Create new users and assign role.
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <h2 className="text-sm font-bold text-slate-800">Users</h2>
          <p className="mt-1 text-xs text-slate-500">
            Change role or remove profile access.
          </p>

          <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="min-w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-semibold">Email</th>
                  <th className="px-3 py-2 font-semibold">Role</th>
                  <th className="px-3 py-2 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isUsersLoading ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={3}>
                      Loading users...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td className="px-3 py-3 text-slate-500" colSpan={3}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.uid} className="border-t border-slate-100">
                      <td className="px-3 py-2.5 text-slate-700">
                        {user.email ?? user.uid}
                      </td>
                      <td className="px-3 py-2.5">
                        <select
                          value={user.role}
                          disabled={
                            isMutatingUid === user.uid ||
                            user.uid === currentUid
                          }
                          onChange={(event) =>
                            onChangeRole(
                              user.uid,
                              event.target.value as UserRole,
                            )
                          }
                          className="h-8 rounded-md border border-slate-200 bg-white px-2 text-xs outline-none"
                        >
                          <option value="admin">admin</option>
                          <option value="superadmin">superadmin</option>
                        </select>
                      </td>
                      <td className="px-3 py-2.5">
                        <button
                          type="button"
                          disabled={
                            isMutatingUid === user.uid ||
                            user.uid === currentUid
                          }
                          onClick={() => onDeleteUser(user.uid)}
                          className="rounded-md border border-red-200 px-2 py-1 font-semibold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <h2 className="text-sm font-bold text-slate-800">Create user</h2>
          <p className="mt-1 text-xs text-slate-500">
            Create a new account and assign an initial role.
          </p>

          <form className="mt-3 space-y-3" onSubmit={onCreateUser}>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#7b1113]"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Temporary Password
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#7b1113]"
              />
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Role
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as UserRole)}
                className="mt-1 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#7b1113]"
              >
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-10 w-full rounded-lg bg-[#7b1113] text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating..." : "Create user"}
            </button>
          </form>
        </section>
      </div>

      {message && (
        <p className="mt-3 rounded-md bg-slate-100 px-3 py-2 text-xs text-slate-700">
          {message}
        </p>
      )}

      <p className="mt-2 text-[11px] text-slate-500">
        Delete removes both the Firebase Auth account and the matching profile
        document.
      </p>

      <Link
        href="/admin"
        className="mt-4 inline-block text-xs font-semibold text-slate-700"
      >
        Back to admin dashboard
      </Link>
    </div>
  );
}
