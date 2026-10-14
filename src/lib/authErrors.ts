/** Maps Firebase Auth error codes to messages suited to account settings. */
export const getAuthErrorMessage = (error: unknown): string => {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
      ? (error as { code: string }).code
      : undefined;

  switch (code) {
    case "auth/invalid-email":
      return "That email address is not valid.";
    case "auth/user-not-found":
      return "No user account was found with that email address.";
    case "auth/email-already-in-use":
      return "That email address is already linked to another account.";
    case "auth/missing-password":
      return "Enter your current password to confirm this change.";
    case "auth/weak-password":
      return "Choose a password of at least 6 characters.";
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Current password is incorrect.";
    case "auth/too-many-requests":
      return "Too many attempts. Wait a moment and try again.";
    case "auth/requires-recent-login":
      return "This change needs a fresh sign-in. Sign out and back in, then retry.";
    case "auth/operation-not-allowed":
      return "This operation is disabled for the project. Contact the project owner.";
    case "auth/network-request-failed":
      return "Network error. Check your connection and try again.";
    default:
      return error instanceof Error && error.message
        ? error.message
        : "Something went wrong. Please try again.";
  }
};
