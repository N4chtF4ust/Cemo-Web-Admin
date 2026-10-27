import {
  addDoc,
  collection,
  getDocs,
  query,
  Timestamp,
  where,
  updateDoc,
  doc,
} from "firebase/firestore";
import { db } from "../firebase";
import { deleteUserProfile } from "./users";

export type DeletionRequestStatus = "PENDING" | "REVIEWED" | "DELETED";

export interface AccountDeletionRequest {
  id: string;
  uid: string;
  email: string;
  displayName: string | null;
  reason: string | null;
  status: DeletionRequestStatus;
  createdAt: Date;
  reviewedAt: Date | null;
}

const mapRequest = (id: string, data: Record<string, unknown>): AccountDeletionRequest => ({
  id,
  uid: String(data.uid || ""),
  email: String(data.email || ""),
  displayName: typeof data.displayName === "string" ? data.displayName : null,
  reason: typeof data.reason === "string" ? data.reason : null,
  status: data.status === "DELETED" ? "DELETED" : data.status === "REVIEWED" ? "REVIEWED" : "PENDING",
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
  reviewedAt: data.reviewedAt instanceof Timestamp ? data.reviewedAt.toDate() : null,
});

export async function createAccountDeletionRequest(input: {
  uid: string;
  email: string;
  displayName?: string | null;
  reason?: string | null;
}) {
  const existing = await getAccountDeletionRequestsForUser(input.uid);
  if (existing.some((request) => request.status === "PENDING")) {
    throw new Error("You already have a pending account deletion request.");
  }

  await addDoc(collection(db, "accountDeletionRequests"), {
    uid: input.uid,
    email: input.email,
    displayName: input.displayName || null,
    reason: input.reason?.trim() || null,
    status: "PENDING",
    createdAt: Timestamp.now(),
    reviewedAt: null,
  });
}

export async function getAccountDeletionRequestsForUser(uid: string) {
  const snapshot = await getDocs(
    query(
      collection(db, "accountDeletionRequests"),
      where("uid", "==", uid),
    ),
  );
  return snapshot.docs
    .map((item) => mapRequest(item.id, item.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function getAccountDeletionRequests() {
  const snapshot = await getDocs(
    query(collection(db, "accountDeletionRequests")),
  );
  return snapshot.docs
    .map((item) => mapRequest(item.id, item.data()))
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export async function markAccountDeletionRequestReviewed(id: string) {
  await updateDoc(doc(db, "accountDeletionRequests", id), {
    status: "REVIEWED",
    reviewedAt: Timestamp.now(),
  });
}

export async function approveAccountDeletionRequest(request: AccountDeletionRequest) {
  await deleteUserProfile(request.uid);
  await updateDoc(doc(db, "accountDeletionRequests", request.id), {
    status: "DELETED",
    reviewedAt: Timestamp.now(),
  });
}
