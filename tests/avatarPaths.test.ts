import { describe, it, expect } from "vitest";
import {
  avatarExtension,
  avatarObjectCandidates,
  avatarObjectPath,
  isManagedAvatarUrl,
  AVATAR_EXTENSIONS,
} from "../src/lib/storage/avatarPaths";

/** The exact predicate the deployed storage rules apply to the file name. */
const allowedByRules = (uid: string, path: string) => {
  const fileName = path.replace(/^avatars\//, "");
  return new RegExp(`^${uid}\\.(webp|jpg|jpeg|png)$`).test(fileName);
};

const UID = "CHJUeleI5FdPDVTiudMxrO9B98C2";

describe("avatarExtension", () => {
  it("maps the encoder output types", () => {
    expect(avatarExtension("image/webp")).toBe("webp");
    expect(avatarExtension("image/png")).toBe("png");
    expect(avatarExtension("image/jpeg")).toBe("jpg");
  });

  it("falls back to jpg for anything unexpected", () => {
    expect(avatarExtension("image/gif")).toBe("jpg");
    expect(avatarExtension("")).toBe("jpg");
  });

  it("only ever produces an extension the rules accept", () => {
    ["image/webp", "image/png", "image/jpeg", "image/gif", "image/avif", "x"].forEach((type) => {
      expect(AVATAR_EXTENSIONS).toContain(avatarExtension(type) as never);
    });
  });
});

describe("avatarObjectPath", () => {
  it("names the object {uid}.{ext} under avatars/", () => {
    expect(avatarObjectPath(UID, "image/webp")).toBe(`avatars/${UID}.webp`);
    expect(avatarObjectPath(UID, "image/jpeg")).toBe(`avatars/${UID}.jpg`);
  });

  it("produces a path the storage rules permit", () => {
    ["image/webp", "image/png", "image/jpeg", "image/gif"].forEach((type) => {
      expect(allowedByRules(UID, avatarObjectPath(UID, type))).toBe(true);
    });
  });

  it("rejects the extensionless path that caused storage/unauthorized", () => {
    expect(allowedByRules(UID, `avatars/${UID}`)).toBe(false);
  });
});

describe("avatarObjectCandidates", () => {
  it("covers every extension the account could own", () => {
    const candidates = avatarObjectCandidates(UID);
    expect(candidates).toHaveLength(AVATAR_EXTENSIONS.length);
    candidates.forEach((candidate) => expect(allowedByRules(UID, candidate)).toBe(true));
  });

  it("includes whatever path an upload would write to", () => {
    const candidates = avatarObjectCandidates(UID);
    ["image/webp", "image/png", "image/jpeg"].forEach((type) => {
      expect(candidates).toContain(avatarObjectPath(UID, type));
    });
  });
});

describe("isManagedAvatarUrl", () => {
  it("recognises download URLs from our own bucket", () => {
    expect(
      isManagedAvatarUrl(
        `https://firebasestorage.googleapis.com/v0/b/cemo-b3ee6.firebasestorage.app/o/avatars%2F${UID}.webp?alt=media&token=abc`,
      ),
    ).toBe(true);
  });

  it("ignores external and empty URLs", () => {
    expect(isManagedAvatarUrl("https://api.dicebear.com/7.x/avataaars/svg?seed=Admin")).toBe(false);
    expect(isManagedAvatarUrl(null)).toBe(false);
    expect(isManagedAvatarUrl(undefined)).toBe(false);
    expect(isManagedAvatarUrl("")).toBe(false);
  });
});
