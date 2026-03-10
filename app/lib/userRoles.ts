import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  type Firestore,
} from "firebase/firestore";

export type UserRole = "admin" | "superadmin";

export async function getUserRole(db: Firestore, uid: string) {
  const snapshot = await getDoc(doc(db, "profiles", uid));
  if (!snapshot.exists()) {
    return null;
  }

  const role = snapshot.data().role;
  return role === "superadmin" ? "superadmin" : "admin";
}

export async function ensureAdminRole(
  db: Firestore,
  uid: string,
  email: string | null,
) {
  const snapshot = await getDoc(doc(db, "profiles", uid));
  if (snapshot.exists()) {
    return;
  }

  await setDoc(doc(db, "profiles", uid), {
    role: "admin",
    email: email ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
