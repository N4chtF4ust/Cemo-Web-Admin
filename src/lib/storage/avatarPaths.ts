/**
 * Object naming for avatars.
 *
 * Storage rules require the file to be named `{uid}.{ext}` with ext limited to
 * webp/jpg/jpeg/png, so the extension is part of the contract - an extensionless
 * path is rejected with storage/unauthorized.
 */

export const AVATAR_EXTENSIONS = ["webp", "jpg", "jpeg", "png"] as const;

/** Content types that may be uploaded as-is; anything else must be re-encoded. */
export const STORABLE_IMAGE_TYPES = ["image/webp", "image/jpeg", "image/png"] as const;

export const avatarExtension = (contentType: string): string => {
  switch (contentType) {
    case "image/webp":
      return "webp";
    case "image/png":
      return "png";
    default:
      return "jpg";
  }
};

export const avatarObjectPath = (uid: string, contentType: string): string =>
  `avatars/${uid}.${avatarExtension(contentType)}`;

/** Every name the account could legitimately own, used when clearing old files. */
export const avatarObjectCandidates = (uid: string): string[] =>
  AVATAR_EXTENSIONS.map((extension) => `avatars/${uid}.${extension}`);

/** True when the URL points at this account's avatar in our own bucket. */
export const isManagedAvatarUrl = (url: string | null | undefined): boolean =>
  Boolean(url && url.includes("/o/avatars%2F"));
