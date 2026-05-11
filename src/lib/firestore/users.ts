import { 
  doc, 
  getDoc, 
  getDocs, 
  collection, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { db } from "../firebase";

export enum UserRole {
  ADMIN = "ADMIN",
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
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Converts Firestore data to UserProfile interface.
 */
const mapToUserProfile = (data: any): UserProfile => ({
  ...data,
  createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : new Date()),
  updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : (data.updatedAt ? new Date(data.updatedAt) : new Date()),
});

/**
 * Creates a new user profile in Firestore.
 */
export const createUserProfile = async (profile: Omit<UserProfile, "createdAt" | "updatedAt">) => {
  const userRef = doc(db, "users", profile.uid);
  const now = new Date();
  
  const newProfile = {
    ...profile,
    createdAt: Timestamp.fromDate(now),
    updatedAt: Timestamp.fromDate(now),
  };

  await setDoc(userRef, newProfile);
  return { ...profile, createdAt: now, updatedAt: now };
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

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return mapToUserProfile({
        ...data,
        uid: data.uid || doc.id // Fallback to doc ID if uid field is missing
      });
    });
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
    return mapToUserProfile(userSnap.data());
  }

  return null;
};

/**
 * Updates a user's profile.
 */
export const updateUserProfile = async (uid: string, data: Partial<Omit<UserProfile, "uid" | "createdAt" | "updatedAt">>) => {
  const userRef = doc(db, "users", uid);
  const now = new Date();
  
  const updateData = {
    ...data,
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
