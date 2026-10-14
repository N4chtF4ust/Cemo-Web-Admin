import { initializeApp, deleteApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail 
} from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { firebaseConfig, auth } from "./firebase";
import { avatarObjectPath } from "./storage/avatarPaths";
import { compressImage } from "./imageCompression";

export interface CreateStaffResult {
  uid: string;
  photoUrl: string | null;
  emailSent: boolean;
}

/**
 * Creates a staff user account in Firebase Authentication using a dedicated secondary app.
 * This ensures the currently logged-in administrator is NEVER logged out.
 * 
 * If an avatarFile is provided, uploads it directly via the secondary app's Storage instance
 * so that Storage rules (which require request.auth.uid == fileName) are fully satisfied.
 * 
 * Dispatches a password reset email so the staff member can set their password and log in.
 */
export async function createStaffAuthAccount(
  email: string,
  avatarFile?: File | null,
): Promise<CreateStaffResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const tempAppName = `staff_creator_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const secondaryApp = initializeApp(firebaseConfig, tempAppName);
  const secondaryAuth = getAuth(secondaryApp);

  const tempPassword = `Tmp#${Math.random().toString(36).slice(-8)}${Math.random().toString(36).slice(-6).toUpperCase()}9!`;

  let uid: string;
  let photoUrl: string | null = null;
  let emailSent = false;

  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, normalizedEmail, tempPassword);
    uid = credential.user.uid;

    // Upload avatar using secondaryApp so request.auth.uid matches the new user's UID
    if (avatarFile) {
      try {
        const compressed = await compressImage(avatarFile);
        const secondaryStorage = getStorage(secondaryApp);
        const path = avatarObjectPath(uid, compressed.type);
        const targetRef = ref(secondaryStorage, path);

        await uploadBytes(targetRef, compressed.blob, {
          contentType: compressed.type,
          cacheControl: "public,max-age=31536000",
        });

        photoUrl = await getDownloadURL(targetRef);
      } catch (storageErr) {
        console.warn("Staff avatar upload to storage failed, attempting tiny thumbnail fallback:", storageErr);
        try {
          const tinyThumb = await compressImage(avatarFile, { maxDimension: 96, quality: 0.6 });
          const thumbDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(tinyThumb.blob);
          });
          // Ensure base64 string never exceeds 40KB so Firestore 1MB limit is never violated
          if (thumbDataUrl.length <= 40000) {
            photoUrl = thumbDataUrl;
          }
        } catch {
          photoUrl = null;
        }
      }
    }

    try {
      await sendPasswordResetEmail(secondaryAuth, normalizedEmail);
      emailSent = true;
    } catch (resetErr) {
      console.warn("Secondary auth sendPasswordResetEmail failed, retrying with primary auth:", resetErr);
      try {
        await sendPasswordResetEmail(auth, normalizedEmail);
        emailSent = true;
      } catch (primaryErr) {
        console.error("Primary auth sendPasswordResetEmail failed:", primaryErr);
      }
    }
  } catch (err: any) {
    if (err?.code === "auth/email-already-in-use") {
      try {
        await sendPasswordResetEmail(auth, normalizedEmail);
        emailSent = true;
      } catch (resetErr) {
        console.error("Failed to send reset email for existing user:", resetErr);
      }
    }
    throw err;
  } finally {
    try {
      await deleteApp(secondaryApp);
    } catch (deleteErr) {
      console.warn("Error cleaning up secondary Firebase app:", deleteErr);
    }
  }

  return { uid, photoUrl, emailSent };
}

/**
 * Dispatches a password setup / reset email to the specified address.
 */
export async function sendStaffPasswordReset(email: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  await sendPasswordResetEmail(auth, normalizedEmail);
  return true;
}
