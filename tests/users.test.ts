import { describe, it, expect, vi, beforeEach } from "vitest";
import { createUserProfile, getUserProfile, UserRole } from "../src/lib/firestore/users";
import { setDoc, getDoc, doc } from "firebase/firestore";

// ✅ Mock document reference
const mockDocRef = { id: "mock-doc-ref" };

vi.mock("firebase/firestore", () => {
  class MockTimestamp {
    constructor(public date: Date) {}
    toDate() { return this.date; }
    static fromDate(date: Date) { return new MockTimestamp(date); }
  }

  return {
    getFirestore: vi.fn(),
    doc: vi.fn(() => mockDocRef),
    setDoc: vi.fn(),
    getDoc: vi.fn(),
    updateDoc: vi.fn(),
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    getDocs: vi.fn(),
    deleteDoc: vi.fn(),
    Timestamp: MockTimestamp,
  };
});

vi.mock("../src/lib/firebase", () => ({
  db: {},
}));

describe("User Profile Functions", () => {
  const mockUid = "test-uid-123";
  const mockEmail = "test@cemo.tech";
  const mockDisplayName = "Test User";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should create a user profile with the 'USER' role", async () => {
    const profileData = {
      uid: mockUid,
      email: mockEmail,
      displayName: mockDisplayName,
      firstName: "Test",
      lastName: "User",
      photoUrl: null,
      role: UserRole.USER,
      isIndividual: true,
      establishmentName: null,
      establishmentAddress: null,
    };

    await createUserProfile(profileData);

    expect(doc).toHaveBeenCalledWith(expect.anything(), "users", mockUid);

    expect(setDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          uid: mockUid,
          email: mockEmail,
          role: UserRole.USER,
        })
    );
  });

  it("should fetch a user profile correctly", async () => {
    const mockData = {
      uid: mockUid,
      email: mockEmail,
      role: UserRole.ADMIN,
      isIndividual: false,
      establishmentName: "CEMO Labs",
      establishmentAddress: "Main Street",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    (getDoc as any).mockResolvedValueOnce({
      exists: () => true,
      data: () => mockData,
    });

    const profile = await getUserProfile(mockUid);

    expect(profile?.uid).toEqual(mockData.uid);
    expect(doc).toHaveBeenCalledWith(expect.anything(), "users", mockUid);
  });

  it("should return null if user profile does not exist", async () => {
    (getDoc as any).mockResolvedValueOnce({
      exists: () => false,
    });

    const profile = await getUserProfile("non-existent");

    expect(profile).toBeNull();
  });
});
