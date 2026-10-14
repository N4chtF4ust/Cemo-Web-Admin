import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  query,
  where,
  setDoc, 
  updateDoc, 
  deleteDoc, 
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase";

export enum UserRole {
  ADMIN = "ADMIN",
  STAFF = "STAFF",
  USER = "USER",
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  role: UserRole;
  isIndividual: boolean;
  establishmentName: string | null;
  establishmentAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Ensures photoUrl never exceeds safe length limits.
 * HTTP(S) URLs are passed through as normal.
 * Data URLs longer than 50KB are dropped so Firestore never throws 1MB document limit errors.
 */
export const sanitizePhotoUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("data:") && url.length <= 50000) {
    return url;
  }
  return null;
};

/**
 * Converts Firestore data to UserProfile interface.
 */
const mapToUserProfile = (data: any, fallbackUid?: string): UserProfile => ({
  uid: data.uid || fallbackUid || "",
  email: data.email || "",
  displayName: data.displayName ?? null,
  firstName: data.firstName ?? null,
  lastName: data.lastName ?? null,
  photoUrl: data.photoUrl ?? null,
  role:
    data.role === UserRole.ADMIN
      ? UserRole.ADMIN
      : data.role === UserRole.STAFF
        ? UserRole.STAFF
        : UserRole.USER,
  isIndividual: typeof data.isIndividual === "boolean" ? data.isIndividual : true,
  establishmentName: data.establishmentName ?? null,
  establishmentAddress: data.establishmentAddress ?? null,
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
});

/**
 * Creates a new user profile in Firestore.
 */
export const createUserProfile = async (profile: Omit<UserProfile, "createdAt" | "updatedAt">) => {
  const userRef = doc(db, "users", profile.uid);
  const now = new Date();
  
  const cleanPhotoUrl = sanitizePhotoUrl(profile.photoUrl);
  const newProfile = {
    ...profile,
    photoUrl: cleanPhotoUrl,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };

  await setDoc(userRef, newProfile);
  return { ...profile, photoUrl: cleanPhotoUrl, createdAt: now, updatedAt: now };
};

/**
 * Fetches all user profiles from Firestore.
 */
export const getUsers = async (): Promise<UserProfile[]> => {
  try {
    const usersRef = collection(db, "users");
    
    // Attempting a simple fetch without ordering first to diagnose empty results
    const querySnapshot = await getDocs(usersRef);
    
    if (querySnapshot.empty) {
      console.warn("Firestore: 'users' collection is empty.");
      return [];
    }

    return querySnapshot.docs.map((userDoc) => mapToUserProfile(userDoc.data(), userDoc.id));
  } catch (error) {
    console.error("Error fetching users from Firestore:", error);
    throw error;
  }
};

/**
 * Fetches a user profile from Firestore by UID.
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    return mapToUserProfile(userSnap.data(), uid);
  }

  return null;
};

/**
 * Fetches a user profile from Firestore by email.
 */
export const getUserProfileByEmail = async (email: string): Promise<UserProfile | null> => {
  const normalizedEmail = email.trim().toLowerCase();
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", normalizedEmail));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const docSnap = querySnapshot.docs[0];
      return mapToUserProfile(docSnap.data(), docSnap.id);
    }
    return null;
  } catch (error) {
    console.warn("Querying user by email index failed, falling back to all users scan:", error);
    try {
      const all = await getUsers();
      const match = all.find((u) => u.email.toLowerCase() === normalizedEmail);
      return match || null;
    } catch {
      return null;
    }
  }
};

/**
 * Updates a user's profile.
 */
export const updateUserProfile = async (uid: string, data: Partial<Omit<UserProfile, "uid" | "createdAt" | "updatedAt">>) => {
  const userRef = doc(db, "users", uid);
  const now = new Date();
  
  const updateData = {
    ...data,
    ...(data.photoUrl !== undefined ? { photoUrl: sanitizePhotoUrl(data.photoUrl) } : {}),
    updatedAt: Timestamp.fromDate(now),
  };

  await updateDoc(userRef, updateData);
  return now;
};

/**
 * Deletes a user profile.
 */
export const deleteUserProfile = async (uid: string) => {
  const userRef = doc(db, "users", uid);
  await deleteDoc(userRef);
};
