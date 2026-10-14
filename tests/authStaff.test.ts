import { describe, it, expect, vi, beforeEach } from "vitest";
import { createStaffAuthAccount, sendStaffPasswordReset } from "../src/lib/authStaff";

const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSendPasswordResetEmail = vi.fn();
const mockInitializeApp = vi.fn();
const mockDeleteApp = vi.fn();
const mockGetAuth = vi.fn();

vi.mock("firebase/app", () => ({
  initializeApp: (...args: any[]) => mockInitializeApp(...args),
  deleteApp: (...args: any[]) => mockDeleteApp(...args),
}));

vi.mock("firebase/auth", () => ({
  getAuth: (...args: any[]) => mockGetAuth(...args),
  createUserWithEmailAndPassword: (...args: any[]) => mockCreateUserWithEmailAndPassword(...args),
  sendPasswordResetEmail: (...args: any[]) => mockSendPasswordResetEmail(...args),
}));

vi.mock("firebase/storage", () => ({
  getStorage: vi.fn(() => ({ name: "secondaryStorage" })),
  ref: vi.fn(),
  uploadBytes: vi.fn().mockResolvedValue(undefined),
  getDownloadURL: vi.fn().mockResolvedValue("https://storage.googleapis.com/avatar.jpg"),
}));

vi.mock("../src/lib/firebase", () => ({
  firebaseConfig: { apiKey: "fake-key", projectId: "fake-project" },
  auth: { name: "primaryAuth" },
}));

describe("authStaff helper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInitializeApp.mockReturnValue({ name: "secondaryApp" });
    mockGetAuth.mockReturnValue({ name: "secondaryAuth" });
    mockDeleteApp.mockResolvedValue(undefined);
  });

  it("creates staff account and sends password reset email without signing out admin", async () => {
    mockCreateUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: "new-staff-uid-456" },
    });
    mockSendPasswordResetEmail.mockResolvedValue(undefined);

    const result = await createStaffAuthAccount("staff@cemo.tech");

    expect(result.uid).toBe("new-staff-uid-456");
    expect(result.emailSent).toBe(true);
    expect(mockInitializeApp).toHaveBeenCalled();
    expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "staff@cemo.tech",
      expect.any(String),
    );
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(),
      "staff@cemo.tech",
    );
    expect(mockDeleteApp).toHaveBeenCalled();
  });

  it("handles existing email and attempts to send password reset link", async () => {
    const error = new Error("Email already in use") as any;
    error.code = "auth/email-already-in-use";
    mockCreateUserWithEmailAndPassword.mockRejectedValue(error);
    mockSendPasswordResetEmail.mockResolvedValue(undefined);

    await expect(createStaffAuthAccount("existing@cemo.tech")).rejects.toThrow();

    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(),
      "existing@cemo.tech",
    );
    expect(mockDeleteApp).toHaveBeenCalled();
  });

  it("dispatches password reset email via sendStaffPasswordReset", async () => {
    mockSendPasswordResetEmail.mockResolvedValue(undefined);

    const success = await sendStaffPasswordReset("staff@cemo.tech");

    expect(success).toBe(true);
    expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(),
      "staff@cemo.tech",
    );
  });
});
