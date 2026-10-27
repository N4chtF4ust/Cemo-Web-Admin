import { useEffect, useState } from "react";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { useCurrentAdmin } from "~/hooks/useCurrentAdmin";
import { UserRole } from "~/lib/firestore/users";
import {
  createAccountDeletionRequest,
  getAccountDeletionRequests,
  getAccountDeletionRequestsForUser,
  approveAccountDeletionRequest,
  type AccountDeletionRequest,
} from "~/lib/firestore/accountDeletionRequests";

function AccountDeletion() {
  const { user, profile, loading, refresh } = useCurrentAdmin();
  const isAdmin = profile?.role === UserRole.ADMIN;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [requests, setRequests] = useState<AccountDeletionRequest[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [requestToApprove, setRequestToApprove] = useState<AccountDeletionRequest | null>(null);

  const getAuthError = (error: unknown) => {
    const code = typeof error === "object" && error !== null && "code" in error
      ? String((error as { code?: unknown }).code || "")
      : "";
    if (code === "auth/invalid-credential" || code === "auth/user-not-found" || code === "auth/wrong-password") {
      return "Invalid email or password.";
    }
    if (code === "auth/invalid-email") return "Enter a valid email address.";
    if (code === "auth/popup-closed-by-user") return "Google sign-in was cancelled.";
    return "Unable to sign in. Please try again.";
  };

  const completeDeletionLogin = async (credential: import("firebase/auth").UserCredential) => {
    const { getUserProfile, getUserProfileByEmail, createUserProfile, deleteUserProfile } =
      await import("~/lib/firestore/users");
    const { getAccountDeletionRequestsForUser } = await import("~/lib/firestore/accountDeletionRequests");
    let signedInProfile = await getUserProfile(credential.user.uid);
    const priorRequests = await getAccountDeletionRequestsForUser(credential.user.uid);
    if (priorRequests.some((request) => request.status === "DELETED")) {
      throw new Error("This account has already been deleted.");
    }
    if (!signedInProfile && credential.user.email) {
      const emailMatch = await getUserProfileByEmail(credential.user.email);
      if (emailMatch) {
        signedInProfile = await createUserProfile({ ...emailMatch, uid: credential.user.uid });
        if (emailMatch.uid !== credential.user.uid) await deleteUserProfile(emailMatch.uid);
      }
    }
    if (!signedInProfile) {
      await createUserProfile({
        uid: credential.user.uid,
        email: credential.user.email || "",
        displayName: credential.user.displayName || credential.user.email?.split("@")[0] || "User",
        firstName: null,
        lastName: null,
        photoUrl: credential.user.photoURL || null,
        role: UserRole.USER,
        isIndividual: true,
        establishmentName: null,
        establishmentAddress: null,
      });
    }
  };

  const handleEmailLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setAuthBusy(true);
    setAuthError("");
    try {
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      const { auth } = await import("~/lib/firebase");
      await completeDeletionLogin(await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password));
      await refresh();
    } catch (loginError) {
      setAuthError(getAuthError(loginError));
    } finally {
      setAuthBusy(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthBusy(true);
    setAuthError("");
    try {
      const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
      const { auth } = await import("~/lib/firebase");
      await completeDeletionLogin(await signInWithPopup(auth, new GoogleAuthProvider()));
      await refresh();
    } catch (loginError) {
      setAuthError(getAuthError(loginError));
    } finally {
      setAuthBusy(false);
    }
  };

  const loadRequests = async () => {
    if (!user) return;
    setError("");
    try {
      setRequests(isAdmin ? await getAccountDeletionRequests() : await getAccountDeletionRequestsForUser(user.uid));
    } catch (loadError) {
      console.error("Account deletion requests could not be loaded:", loadError);
      setError("Unable to load account deletion requests.");
    }
  };

  useEffect(() => {
    if (!loading && user) void loadRequests();
  }, [loading, user, isAdmin]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user || !profile) return;
    setSaving(true);
    setNotice("");
    setError("");
    try {
      await createAccountDeletionRequest({
        uid: user.uid,
        email: user.email || profile.email,
        displayName: profile.displayName,
        reason,
      });
      setReason("");
      setNotice("Your account deletion request was sent to an administrator.");
      await loadRequests();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit your request.");
    } finally {
      setSaving(false);
    }
  };

  const handleReview = async (request: AccountDeletionRequest) => {
    try {
      await approveAccountDeletionRequest(request);
      await loadRequests();
    } catch (reviewError) {
      console.error("Account deletion request could not be reviewed:", reviewError);
      setError("Unable to update this request.");
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black text-sm text-zinc-500">Loading...</div>;
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-black p-4">
        <form onSubmit={handleEmailLogin} className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/70 dark:bg-white/[0.03] p-6">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">Delete account</h1>
            <p className="mt-1 text-sm text-zinc-500">Sign in separately to submit an account deletion request.</p>
          </div>
          <Button type="button" variant="outline" onClick={() => void handleGoogleLogin()} disabled={authBusy} className="w-full rounded-xl font-bold">
            Continue with Google
          </Button>
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-zinc-400"><span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" />or email and password<span className="h-px flex-1 bg-zinc-200 dark:bg-white/10" /></div>
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] px-3 py-3 text-sm outline-none focus:border-cemo-primary/50" />
          <input type="password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] px-3 py-3 text-sm outline-none focus:border-cemo-primary/50" />
          <Button type="submit" disabled={authBusy} className="w-full rounded-xl bg-cemo-primary text-black font-bold">
            {authBusy ? "Signing in..." : "Sign in to request deletion"}
          </Button>
          {authError && <p className="text-sm text-red-500">{authError}</p>}
        </form>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div>
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">
          {isAdmin ? "Account deletion requests" : "Delete account"}
        </h2>
        <p className="text-zinc-500 text-sm mt-1">
          {isAdmin
            ? "Review deletion requests submitted by staff and users."
            : "Submit a request for an administrator to remove your CEMO account."}
        </p>
      </div>

      {!isAdmin && (
        <form onSubmit={handleSubmit} className="max-w-2xl bg-white/70 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-6 space-y-4">
          <label className="block space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Reason (optional)</span>
            <textarea value={reason} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setReason(event.target.value)} placeholder="Tell the administrator why you want to delete your account." className="min-h-28 w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] px-3 py-2 text-sm outline-none focus:border-cemo-primary/50 focus:ring-1 focus:ring-cemo-primary/50" />
          </label>
          <p className="text-xs text-zinc-500">Your request is reviewed manually. You will remain signed in until an administrator processes it.</p>
          <Button type="submit" disabled={saving} variant="destructive" className="rounded-xl font-bold">
            {saving ? "Submitting..." : "Request account deletion"}
          </Button>
        </form>
      )}

      {notice && <p className="text-sm text-emerald-500">{notice}</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="space-y-3">
        {requests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-white/10 p-8 text-sm text-zinc-500">
            {isAdmin ? "There are no deletion requests." : "You have not submitted a deletion request."}
          </div>
        ) : requests.map((request) => (
          <div key={request.id} className="bg-white/70 dark:bg-white/[0.03] border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-bold text-zinc-900 dark:text-white truncate">{isAdmin ? request.email : "Account deletion request"}</p>
              <p className="text-xs text-zinc-500 mt-1">{request.reason || "No reason provided."}</p>
              <p className="text-[11px] text-zinc-400 mt-2">{request.createdAt.toLocaleString()}</p>
            </div>
            <Badge className={request.status === "PENDING" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}>
              {request.status}
            </Badge>
            {isAdmin && request.status === "PENDING" && (
              <Button type="button" variant="destructive" onClick={() => setRequestToApprove(request)} className="rounded-xl font-bold text-xs">
                Approve and delete
              </Button>
            )}
          </div>
        ))}
      </div>
      <AlertDialog open={requestToApprove !== null} onOpenChange={(open) => !open && setRequestToApprove(null)}>
        <AlertDialogContent className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve account deletion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the CEMO profile for {requestToApprove?.email || "this user"} and mark the request as deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              className="rounded-xl"
              onClick={() => {
                if (requestToApprove) void handleReview(requestToApprove);
                setRequestToApprove(null);
              }}
            >
              Approve and delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

export { AccountDeletion };
export default AccountDeletion;
