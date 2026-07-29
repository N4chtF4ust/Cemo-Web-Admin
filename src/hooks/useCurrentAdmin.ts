import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "~/lib/firebase";
import { getUserProfile, updateUserProfile, type UserProfile } from "~/lib/firestore/users";

interface CurrentAdminState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  /** Re-reads the Firestore profile, e.g. after saving changes. */
  refresh: () => Promise<void>;
}

/**
 * Tracks the signed-in account and its Firestore profile.
 *
 * Email changes land on the auth record first (they complete out-of-band via a
 * verification link), so the profile document is healed here once they differ.
 */
export function useCurrentAdmin(): CurrentAdminState {
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (account: User | null) => {
    if (!account) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await getUserProfile(account.uid);

      if (nextProfile && account.email && nextProfile.email !== account.email) {
        await updateUserProfile(account.uid, { email: account.email });
        setProfile({ ...nextProfile, email: account.email });
        return;
      }

      setProfile(nextProfile);
    } catch (error) {
      console.error("useCurrentAdmin: failed to load profile:", error);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (account) => {
      setUser(account);
      await loadProfile(account);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadProfile]);

  const refresh = useCallback(async () => {
    const account = auth.currentUser;
    setUser(account);
    await loadProfile(account);
  }, [loadProfile]);

  return { user, profile, loading, refresh };
}
