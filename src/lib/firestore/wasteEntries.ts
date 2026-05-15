import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  Timestamp, 
  query, 
  orderBy,
  setDoc,
  collectionGroup,
  limit
} from "firebase/firestore";
import { db } from "../firebase";

export interface WasteEntry {
  id: string;
  weightAdded: number;
  category: string;
  timestamp: Date;
  methanePotential: number;
  co2Potential: number;
  humidity: number;
  temperature: number;
  userId?: string; // Added for cross-user identification
}

/**
 * Converts Firestore data to WasteEntry interface.
 */
const mapToWasteEntry = (data: any, fallbackId?: string): WasteEntry => ({
  id: data.id || fallbackId || "",
  weightAdded: Number(data.weightAdded) || 0,
  category: data.category || "Others",
  timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : (data.timestamp ? new Date(data.timestamp) : new Date()),
  methanePotential: Number(data.methanePotential) || 0,
  co2Potential: Number(data.co2Potential) || 0,
  humidity: Number(data.humidity) || 0,
  temperature: Number(data.temperature) || 0,
});

/**
 * Fetches all waste entries for a specific user.
 */
export const getWasteEntries = async (userId: string): Promise<WasteEntry[]> => {
  try {
    const entriesRef = collection(db, "users", userId, "waste_entries");
    const q = query(entriesRef, orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map((doc) => mapToWasteEntry(doc.data(), doc.id));
  } catch (error) {
    console.error(`Error fetching waste entries for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Fetches all waste entries across all users.
 * Note: Requires a collection group index for 'waste_entries' ordered by 'timestamp' desc.
 */
export const getAllWasteEntries = async (max: number = 100): Promise<WasteEntry[]> => {
  try {
    const entriesQuery = query(
      collectionGroup(db, "waste_entries"), 
      orderBy("timestamp", "desc"),
      limit(max)
    );
    const querySnapshot = await getDocs(entriesQuery);
    
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // Extract userId from parent path /users/{userId}/waste_entries/{id}
      const userId = doc.ref.parent.parent?.id;
      return { ...mapToWasteEntry(data, doc.id), userId };
    });
  } catch (error) {
    console.error("Error fetching global waste entries:", error);
    // If index doesn't exist, we fall back to an un-ordered query or empty array
    // to prevent dashboard crash
    try {
      const fallbackQuery = query(collectionGroup(db, "waste_entries"), limit(max));
      const querySnapshot = await getDocs(fallbackQuery);
      return querySnapshot.docs.map((doc) => ({
        ...mapToWasteEntry(doc.data(), doc.id),
        userId: doc.ref.parent.parent?.id
      }));
    } catch (innerError) {
      return [];
    }
  }
};

/**
 * Adds a new waste entry for a specific user.
 */
export const addWasteEntry = async (userId: string, entry: Omit<WasteEntry, "timestamp">) => {
  const entriesRef = collection(db, "users", userId, "waste_entries");
  const now = new Date();
  
  const newEntry = {
    ...entry,
    timestamp: Timestamp.fromDate(now),
  };

  if (entry.id) {
    await setDoc(doc(db, "users", userId, "waste_entries", entry.id), newEntry);
    return { ...entry, timestamp: now };
  } else {
    const docRef = await addDoc(entriesRef, newEntry);
    return { ...entry, id: docRef.id, timestamp: now };
  }
};

/**
 * Updates a waste entry.
 */
export const updateWasteEntry = async (userId: string, entryId: string, data: Partial<Omit<WasteEntry, "id" | "timestamp">>) => {
  const entryRef = doc(db, "users", userId, "waste_entries", entryId);
  await updateDoc(entryRef, data);
};

/**
 * Deletes a waste entry.
 */
export const deleteWasteEntry = async (userId: string, entryId: string) => {
  const entryRef = doc(db, "users", userId, "waste_entries", entryId);
  await deleteDoc(entryRef);
};
