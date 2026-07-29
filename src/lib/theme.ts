export type ThemePreference = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "cemo:theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Narrows arbitrary stored values to a valid preference, defaulting to "system". */
export const parseTheme = (value: unknown): ThemePreference =>
  value === "light" || value === "dark" || value === "system" ? value : "system";

/** Resolves a preference to the class that should be on <html>. */
export const resolveTheme = (
  preference: ThemePreference,
  prefersDark: boolean,
): ResolvedTheme => {
  if (preference === "system") return prefersDark ? "dark" : "light";
  return preference;
};

const prefersDark = () =>
  typeof window !== "undefined" && window.matchMedia(DARK_QUERY).matches;

export const getStoredTheme = (): ThemePreference => {
  if (typeof window === "undefined") return "system";
  try {
    return parseTheme(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Private browsing / blocked storage: fall back to following the OS.
    return "system";
  }
};

/** Applies a preference to the document without persisting it. */
export const applyTheme = (preference: ThemePreference): ResolvedTheme => {
  const resolved = resolveTheme(preference, prefersDark());
  document.documentElement.classList.toggle("dark", resolved === "dark");
  return resolved;
};

export const setTheme = (preference: ThemePreference): ResolvedTheme => {
  try {
    if (preference === "system") {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, preference);
    }
  } catch {
    // Preference just won't survive a reload.
  }
  return applyTheme(preference);
};

/**
 * Applies the saved preference and keeps "system" in sync with the OS.
 * An explicit light/dark choice is no longer overridden by OS changes.
 */
export const initTheme = () => {
  applyTheme(getStoredTheme());

  const mediaQuery = window.matchMedia(DARK_QUERY);
  const handleChange = () => {
    if (getStoredTheme() === "system") applyTheme("system");
  };

  mediaQuery.addEventListener("change", handleChange);
  return () => mediaQuery.removeEventListener("change", handleChange);
};
