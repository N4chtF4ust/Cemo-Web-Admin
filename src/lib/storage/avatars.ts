import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "../firebase";
import { avatarObjectCandidates, avatarObjectPath } from "./avatarPaths";

export { isManagedAvatarUrl } from "./avatarPaths";

const isNotFound = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: string }).code === "storage/object-not-found";

const removePath = async (path: string): Promise<void> => {
  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    if (isNotFound(error)) return;
    throw error;
  }
};

/**
 * Uploads the avatar as `avatars/{uid}.{ext}`, then clears any copy left behind
 * under a different extension so an account only ever owns one avatar object.
 */
export const uploadAvatar = async (
  uid: string,
  blob: Blob,
  contentType: string,
): Promise<string> => {
  const path = avatarObjectPath(uid, contentType);
  const target = ref(storage, path);

  await uploadBytes(target, blob, {
    contentType,
    cacheControl: "public,max-age=31536000",
  });

  const url = await getDownloadURL(target);

  // Best effort: a leftover file is untidy, not a failure worth surfacing.
  await Promise.all(
    avatarObjectCandidates(uid)
      .filter((candidate) => candidate !== path)
      .map((candidate) => removePath(candidate).catch(() => undefined)),
  );

  return url;
};

/** Removes the stored avatar in whichever format it was saved. */
export const deleteAvatar = async (uid: string): Promise<void> => {
  await Promise.all(avatarObjectCandidates(uid).map((candidate) => removePath(candidate)));
};
