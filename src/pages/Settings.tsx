import { useEffect, useMemo, useRef, useState } from "react";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
} from "firebase/auth";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  ViewIcon,
  ViewOffSlashIcon,
  Mail01Icon,
  ImageUpload01Icon,
  Delete02Icon,
} from "@hugeicons/core-free-icons";
import { DashboardLayout } from "~/components/dashboard/DashboardLayout";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import { Skeleton } from "~/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { useCurrentAdmin } from "~/hooks/useCurrentAdmin";
import { auth } from "~/lib/firebase";
import { updateUserProfile } from "~/lib/firestore/users";
import { getAuthErrorMessage } from "~/lib/authErrors";
import { deleteAvatar, isManagedAvatarUrl, uploadAvatar } from "~/lib/storage/avatars";
import {
  compressImage,
  formatBytes,
  validateImageFile,
  type CompressedImage,
} from "~/lib/imageCompression";
import { cn } from "~/lib/utils";

type Feedback = { tone: "success" | "error"; message: string } | null;

const MIN_PASSWORD_LENGTH = 6;

/** Section shell so every card on the page shares one look. */
function SettingsCard({
  title,
  description,
  children,
  footer,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <section className="bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
      <header className="px-6 pt-6 pb-4">
        <h3 className="text-base font-bold text-zinc-900 dark:text-white">{title}</h3>
        <p className="text-xs text-zinc-500 mt-1">{description}</p>
      </header>
      <div className="px-6 pb-6 space-y-4">{children}</div>
      {footer && (
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-white/[0.01] flex flex-wrap items-center justify-end gap-3">
          {footer}
        </div>
      )}
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[11px] text-zinc-400">{hint}</span>}
    </label>
  );
}

function Notice({ feedback }: { feedback: Feedback }) {
  if (!feedback) return null;

  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs font-medium",
        feedback.tone === "success"
          ? "border-cemo-primary/30 bg-cemo-primary/10 text-emerald-700 dark:text-cemo-primary"
          : "border-red-500/20 bg-red-500/5 text-red-500",
      )}
    >
      <HugeiconsIcon
        icon={feedback.tone === "success" ? CheckmarkCircle02Icon : AlertCircleIcon}
        className="size-4 shrink-0 mt-px"
      />
      <span>{feedback.message}</span>
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        type={visible ? "text" : "password"}
        value={value}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder || "••••••••"}
        className="pr-10 rounded-xl border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
      >
        <HugeiconsIcon icon={visible ? ViewOffSlashIcon : ViewIcon} className="size-4" />
      </button>
    </div>
  );
}

function Settings() {
  const { user, profile, loading, refresh } = useCurrentAdmin();

  // Profile form
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [displayNameValue, setDisplayNameValue] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState<Feedback>(null);

  // Avatar picker: the compressed blob is held locally and only uploaded on save,
  // so abandoning the form never leaves an orphaned object in storage.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingAvatar, setPendingAvatar] = useState<CompressedImage | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarCleared, setAvatarCleared] = useState(false);
  const [processingAvatar, setProcessingAvatar] = useState(false);

  // Email form
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<Feedback>(null);

  // Password form
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordFeedback, setPasswordFeedback] = useState<Feedback>(null);

  const [sessionFeedback, setSessionFeedback] = useState<Feedback>(null);

  // Seed the profile form once the account resolves.
  useEffect(() => {
    if (!profile) return;
    setFirstName(profile.firstName || "");
    setLastName(profile.lastName || "");
    setDisplayNameValue(profile.displayName || "");
    setPhotoUrl(profile.photoUrl || "");
  }, [profile]);

  // Release the preview URL when it is replaced or the page unmounts.
  useEffect(() => {
    if (!avatarPreview) return;
    return () => URL.revokeObjectURL(avatarPreview);
  }, [avatarPreview]);

  const accountName = useMemo(() => {
    const composed = `${firstName} ${lastName}`.trim();
    return composed || displayNameValue || user?.email || "Administrator";
  }, [firstName, lastName, displayNameValue, user]);

  const initials = accountName.slice(0, 2).toUpperCase();
  const shownAvatar = avatarPreview ?? (avatarCleared ? null : photoUrl || null);

  const handlePickAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // Reset so picking the same file twice still fires a change event.
    event.target.value = "";
    if (!file) return;

    setProfileFeedback(null);

    const invalid = validateImageFile(file);
    if (invalid) {
      setProfileFeedback({ tone: "error", message: invalid });
      return;
    }

    setProcessingAvatar(true);
    try {
      const compressed = await compressImage(file);
      setPendingAvatar(compressed);
      setAvatarPreview(URL.createObjectURL(compressed.blob));
      setAvatarCleared(false);
    } catch (error) {
      console.error("Settings: image compression failed:", error);
      setProfileFeedback({
        tone: "error",
        message: error instanceof Error ? error.message : "That image could not be processed.",
      });
    } finally {
      setProcessingAvatar(false);
    }
  };

  const handleClearAvatar = () => {
    setPendingAvatar(null);
    setAvatarPreview(null);
    setAvatarCleared(true);
    setProfileFeedback(null);
  };

  const avatarHint = pendingAvatar
    ? `Compressed ${formatBytes(pendingAvatar.originalSize)} to ${formatBytes(
        pendingAvatar.size,
      )} at ${pendingAvatar.width}x${pendingAvatar.height}. Press Save changes to upload.`
    : "PNG, JPG or WebP. Resized and compressed in your browser before upload.";

  const handleSaveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setSavingProfile(true);
    setProfileFeedback(null);

    const normalize = (value: string) => value.trim() || null;

    try {
      const nextDisplayName = normalize(displayNameValue);
      let nextPhotoUrl = normalize(photoUrl);

      if (pendingAvatar) {
        nextPhotoUrl = await uploadAvatar(user.uid, pendingAvatar.blob, pendingAvatar.type);
      } else if (avatarCleared) {
        // Only our own storage objects are ours to delete; external URLs are just dropped.
        if (isManagedAvatarUrl(photoUrl)) {
          await deleteAvatar(user.uid);
        }
        nextPhotoUrl = null;
      }

      await updateUserProfile(user.uid, {
        firstName: normalize(firstName),
        lastName: normalize(lastName),
        displayName: nextDisplayName,
        photoUrl: nextPhotoUrl,
      });

      // Keep the auth record in step so other surfaces show the same identity.
      await updateProfile(user, {
        displayName: nextDisplayName,
        photoURL: nextPhotoUrl,
      });

      setPhotoUrl(nextPhotoUrl || "");
      setPendingAvatar(null);
      setAvatarPreview(null);
      setAvatarCleared(false);

      await refresh();
      setProfileFeedback({ tone: "success", message: "Profile updated." });
    } catch (error) {
      console.error("Settings: profile update failed:", error);
      setProfileFeedback({ tone: "error", message: getAuthErrorMessage(error) });
    } finally {
      setSavingProfile(false);
    }
  };

  /** Confirms the account password before a sensitive change. */
  const reauthenticate = async (password: string) => {
    if (!user?.email) throw new Error("No signed-in account to verify.");
    const credential = EmailAuthProvider.credential(user.email, password);
    await reauthenticateWithCredential(user, credential);
  };

  const handleChangeEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    const target = newEmail.trim().toLowerCase();
    setEmailFeedback(null);

    if (!target) {
      setEmailFeedback({ tone: "error", message: "Enter the new email address." });
      return;
    }
    if (target === user.email?.toLowerCase()) {
      setEmailFeedback({ tone: "error", message: "That is already your current email." });
      return;
    }
    if (!emailPassword) {
      setEmailFeedback({ tone: "error", message: "Enter your current password to confirm." });
      return;
    }

    setSavingEmail(true);

    try {
      await reauthenticate(emailPassword);
      // Sends a confirmation link; the address only changes once it is clicked,
      // so the address can never be moved to an inbox the admin can't open.
      await verifyBeforeUpdateEmail(user, target);

      setNewEmail("");
      setEmailPassword("");
      setEmailFeedback({
        tone: "success",
        message: `Confirmation sent to ${target}. The sign-in email changes once you open that link.`,
      });
    } catch (error) {
      console.error("Settings: email update failed:", error);
      setEmailFeedback({ tone: "error", message: getAuthErrorMessage(error) });
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;

    setPasswordFeedback(null);

    if (!currentPassword) {
      setPasswordFeedback({ tone: "error", message: "Enter your current password." });
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setPasswordFeedback({
        tone: "error",
        message: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordFeedback({ tone: "error", message: "New passwords do not match." });
      return;
    }
    if (newPassword === currentPassword) {
      setPasswordFeedback({
        tone: "error",
        message: "New password must differ from the current one.",
      });
      return;
    }

    setSavingPassword(true);

    try {
      await reauthenticate(currentPassword);
      await updatePassword(user, newPassword);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordFeedback({ tone: "success", message: "Password updated." });
    } catch (error) {
      console.error("Settings: password update failed:", error);
      setPasswordFeedback({ tone: "error", message: getAuthErrorMessage(error) });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSendReset = async () => {
    if (!user?.email) return;
    setPasswordFeedback(null);

    try {
      await sendPasswordResetEmail(auth, user.email);
      setPasswordFeedback({
        tone: "success",
        message: `Reset link sent to ${user.email}.`,
      });
    } catch (error) {
      setPasswordFeedback({ tone: "error", message: getAuthErrorMessage(error) });
    }
  };

  const handleVerifyEmail = async () => {
    if (!user) return;
    setSessionFeedback(null);

    try {
      await sendEmailVerification(user);
      setSessionFeedback({ tone: "success", message: "Verification email sent." });
    } catch (error) {
      setSessionFeedback({ tone: "error", message: getAuthErrorMessage(error) });
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-24 w-full max-w-3xl rounded-2xl" />
          <Skeleton className="h-[420px] w-full max-w-3xl rounded-2xl" />
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="p-12 text-center text-sm text-zinc-500">
          No active session. Please sign in again.
        </div>
      </DashboardLayout>
    );
  }

  const metadata = user.metadata;

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white tracking-tight">Settings</h2>
        <p className="text-zinc-500 text-sm">Manage your administrator account</p>
      </div>

      <div className="max-w-3xl space-y-6 animate-in fade-in duration-300">
        {/* Identity summary */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 bg-white/70 dark:bg-white/[0.03] backdrop-blur-xl border border-zinc-200 dark:border-white/[0.08] rounded-2xl p-5">
          <Avatar className="size-14 border border-cemo-primary/20">
            <AvatarImage src={shownAvatar || undefined} alt={accountName} />
            <AvatarFallback className="bg-cemo-primary/10 text-cemo-primary font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-zinc-900 dark:text-white truncate">{accountName}</p>
            <p className="text-xs text-zinc-500 truncate">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {profile && (
              <Badge className="bg-cemo-primary/15 text-cemo-primary border border-cemo-primary/30 text-[10px] font-bold tracking-wider uppercase">
                {profile.role}
              </Badge>
            )}
            <Badge
              className={cn(
                "text-[10px] font-bold tracking-wider uppercase border",
                user.emailVerified
                  ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/20",
              )}
            >
              {user.emailVerified ? "Verified" : "Unverified"}
            </Badge>
          </div>
        </div>

        <form onSubmit={handleSaveProfile}>
          <SettingsCard
            title="Administrator profile"
            description="Shown across the console. Changes apply to both your sign-in record and directory entry."
            footer={
              <Button
                type="submit"
                disabled={savingProfile}
                className="rounded-xl bg-cemo-primary text-black hover:bg-cemo-primary/90 font-bold text-xs"
              >
                {savingProfile ? "Saving..." : "Save changes"}
              </Button>
            }
          >
            <Notice feedback={profileFeedback} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First name">
                <Input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder="Enter Name"
                  className="rounded-xl border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]"
                />
              </Field>
              <Field label="Last name">
                <Input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder="Enter Last name "
                  className="rounded-xl border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]"
                />
              </Field>
            </div>
            <Field label="Display name" hint="Falls back to your full name when left blank.">
              <Input
                value={displayNameValue}
                onChange={(event) => setDisplayNameValue(event.target.value)}
                placeholder="Enter Display name"
                className="rounded-xl border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]"
              />
            </Field>
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500">
                Profile photo
              </span>
              <div className="flex items-center gap-4">
                <Avatar className="size-16 border border-zinc-200 dark:border-white/10">
                  <AvatarImage src={shownAvatar || undefined} alt={accountName} />
                  <AvatarFallback className="bg-cemo-primary/10 text-cemo-primary font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePickAvatar}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      disabled={processingAvatar}
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-xl border-zinc-200 dark:border-white/10 font-bold text-xs gap-2"
                    >
                      <HugeiconsIcon icon={ImageUpload01Icon} className="size-4" />
                      {processingAvatar ? "Processing..." : "Choose image"}
                    </Button>
                    {shownAvatar && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleClearAvatar}
                        className="rounded-xl text-xs font-bold text-red-500 hover:text-red-500 hover:bg-red-500/10 gap-2"
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-[11px] text-zinc-400">{avatarHint}</p>
                </div>
              </div>
            </div>
          </SettingsCard>
        </form>

        <form onSubmit={handleChangeEmail}>
          <SettingsCard
            title="Sign-in email"
            description={`Currently ${user.email}. A confirmation link is sent to the new address before the change takes effect.`}
            footer={
              <Button
                type="submit"
                disabled={savingEmail}
                className="rounded-xl bg-cemo-primary text-black hover:bg-cemo-primary/90 font-bold text-xs"
              >
                {savingEmail ? "Sending..." : "Send confirmation"}
              </Button>
            }
          >
            <Notice feedback={emailFeedback} />
            <Field label="New email address">
              <Input
                type="email"
                value={newEmail}
                autoComplete="email"
                onChange={(event) => setNewEmail(event.target.value)}
                placeholder="name@cemo.tech"
                className="rounded-xl border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]"
              />
            </Field>
            <Field label="Current password" hint="Required to confirm it is really you.">
              <PasswordInput
                value={emailPassword}
                onChange={setEmailPassword}
                autoComplete="current-password"
              />
            </Field>
          </SettingsCard>
        </form>

        <form onSubmit={handleChangePassword}>
          <SettingsCard
            title="Password"
            description={`At least ${MIN_PASSWORD_LENGTH} characters. You stay signed in on this device after changing it.`}
            footer={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendReset}
                  className="rounded-xl border-zinc-200 dark:border-white/10 font-bold text-xs gap-2"
                >
                  <HugeiconsIcon icon={Mail01Icon} className="size-4" />
                  Email me a reset link
                </Button>
                <Button
                  type="submit"
                  disabled={savingPassword}
                  className="rounded-xl bg-cemo-primary text-black hover:bg-cemo-primary/90 font-bold text-xs"
                >
                  {savingPassword ? "Updating..." : "Update password"}
                </Button>
              </>
            }
          >
            <Notice feedback={passwordFeedback} />
            <Field label="Current password">
              <PasswordInput
                value={currentPassword}
                onChange={setCurrentPassword}
                autoComplete="current-password"
              />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="New password">
                <PasswordInput
                  value={newPassword}
                  onChange={setNewPassword}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm new password">
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                />
              </Field>
            </div>
          </SettingsCard>
        </form>

        <SettingsCard
          title="Session and account"
          description="Read-only details for the account currently signed in."
        >
          <Notice feedback={sessionFeedback} />
          <dl className="divide-y divide-zinc-200 dark:divide-white/[0.06] text-sm">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Account created
              </dt>
              <dd className="text-xs font-medium text-zinc-900 dark:text-white">
                {metadata.creationTime
                  ? new Date(metadata.creationTime).toLocaleString()
                  : "Unknown"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Last sign-in
              </dt>
              <dd className="text-xs font-medium text-zinc-900 dark:text-white">
                {metadata.lastSignInTime
                  ? new Date(metadata.lastSignInTime).toLocaleString()
                  : "Unknown"}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-xs font-bold uppercase tracking-wider text-zinc-500">
                Email verified
              </dt>
              <dd className="flex items-center gap-3">
                <span className="text-xs font-medium text-zinc-900 dark:text-white">
                  {user.emailVerified ? "Yes" : "No"}
                </span>
                {!user.emailVerified && (
                  <button
                    type="button"
                    onClick={handleVerifyEmail}
                    className="text-[11px] font-bold text-cemo-primary hover:underline"
                  >
                    Send verification
                  </button>
                )}
              </dd>
            </div>
          </dl>
        </SettingsCard>
      </div>
    </DashboardLayout>
  );
}

export { Settings };
export default Settings;
