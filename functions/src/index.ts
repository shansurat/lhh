import {setGlobalOptions} from "firebase-functions";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10, region: "asia-southeast1" });

admin.initializeApp();

export const deleteAuthUser = onCall(async (request) => {
  const callerUid = request.auth?.uid;
  const targetUid = request.data?.uid as string | undefined;

  if (!callerUid) {
    throw new HttpsError("unauthenticated", "Sign in required.");
  }

  if (!targetUid) {
    throw new HttpsError("invalid-argument", "uid is required.");
  }

  if (callerUid === targetUid) {
    throw new HttpsError("failed-precondition", "Cannot delete own account.");
  }

  const db = admin.firestore();
  const callerProfile = await db.doc(`profiles/${callerUid}`).get();
  const role = callerProfile.data()?.role;

  if (role !== "superadmin") {
    throw new HttpsError("permission-denied", "Superadmin only.");
  }

  await admin.auth().deleteUser(targetUid);
  await db.doc(`profiles/${targetUid}`).delete().catch(() => undefined);

  return {ok: true};
});
