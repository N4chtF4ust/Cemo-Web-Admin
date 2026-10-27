import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  DashboardCircleIcon,
  UserCircleIcon,
  Building03Icon,
  Note01Icon,
  Loading03Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { UserRole, getUsers, type UserProfile } from "~/lib/firestore/users";
import { getAllWasteEntries, type WasteEntry } from "~/lib/firestore/wasteEntries";
import { getAccountDeletionRequests, type AccountDeletionRequest } from "~/lib/firestore/accountDeletionRequests";
import {
  buildSearchIndex,
  filterSearchIndexByRole,
  groupResults,
  searchIndex,
  SEARCH_KIND_LABELS,
  type SearchResult,
  type SearchResultKind,
} from "~/lib/globalSearch";
import { useCurrentAdmin } from "~/hooks/useCurrentAdmin";
import { cn } from "~/lib/utils";

const KIND_ICONS: Record<SearchResultKind, typeof Search01Icon> = {
  page: DashboardCircleIcon,
  user: UserCircleIcon,
  establishment: Building03Icon,
  entry: Note01Icon,
  deletionRequest: AlertCircleIcon,
};

const ENTRY_FETCH_LIMIT = 500;
const CACHE_TTL_MS = 2 * 60 * 1000;

/**
 * Module-level cache: the Navbar remounts on every route change, and refetching
 * the whole dataset each time would be wasteful.
 */
let cache: { at: number; users: UserProfile[]; entries: WasteEntry[]; requests: AccountDeletionRequest[]; includesRequests: boolean } | null = null;
let inflight: Promise<{ users: UserProfile[]; entries: WasteEntry[]; requests: AccountDeletionRequest[] }> | null = null;

const loadSearchData = (includeRequests: boolean) => {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS && (!includeRequests || cache.includesRequests)) {
    return Promise.resolve({ users: cache.users, entries: cache.entries, requests: cache.requests });
  }

  if (!inflight) {
    inflight = Promise.all([getUsers(), getAllWasteEntries(ENTRY_FETCH_LIMIT), includeRequests ? getAccountDeletionRequests() : Promise.resolve([])])
      .then(([users, entries, requests]) => {
        cache = { at: Date.now(), users, entries, requests, includesRequests: includeRequests };
        return { users, entries, requests };
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
};

export function GlobalSearch() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { profile } = useCurrentAdmin();
  const isAdmin = profile?.role === UserRole.ADMIN;

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [requests, setRequests] = useState<AccountDeletionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch once the user actually engages with the field.
  const ensureData = () => {
    if (loaded || loading) return;
    setLoading(true);
    setError(null);
    loadSearchData(isAdmin)
      .then((data) => {
        setUsers(data.users);
        setEntries(data.entries);
        setRequests(data.requests);
        setLoaded(true);
      })
      .catch((err: any) => {
        console.error("GlobalSearch: failed to load search data:", err);
        setError(err?.message || "Could not load search data.");
      })
      .finally(() => setLoading(false));
  };

  const index = useMemo(
    () => filterSearchIndexByRole(buildSearchIndex(users, entries, requests), profile?.role),
    [users, entries, requests, profile?.role],
  );
  const results = useMemo(() => searchIndex(index, query), [index, query]);
  const groups = useMemo(() => groupResults(results), [results]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Close when clicking outside the search area.
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  // Ctrl/Cmd+K focuses the search from anywhere in the dashboard.
  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
        setIsOpen(true);
        ensureData();
      }
    };

    document.addEventListener("keydown", handleShortcut);
    return () => document.removeEventListener("keydown", handleShortcut);
  }, [loaded, loading]);

  const goTo = (result: SearchResult) => {
    if (!isAdmin && (result.url.startsWith("/users") || result.url.startsWith("/reports"))) {
      return;
    }
    setIsOpen(false);
    setQuery("");
    inputRef.current?.blur();
    navigate(result.url);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      if (query) {
        setQuery("");
      } else {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (results.length === 0 ? 0 : (current + 1) % results.length));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        results.length === 0 ? 0 : (current - 1 + results.length) % results.length,
      );
      return;
    }

    if (event.key === "Enter") {
      const target = results[activeIndex];
      if (target) {
        event.preventDefault();
        goTo(target);
      }
    }
  };

  const showPanel = isOpen && query.trim().length > 0;
  let flatIndex = -1;

  return (
    <div ref={containerRef} className="relative w-full max-w-md group">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <HugeiconsIcon
          icon={loading ? Loading03Icon : Search01Icon}
          className={cn(
            "size-4 text-zinc-400 group-focus-within:text-cemo-primary transition-colors",
            loading && "animate-spin",
          )}
        />
      </div>
      <input
        ref={inputRef}
        type="text"
        role="combobox"
        aria-expanded={showPanel}
        aria-controls="global-search-results"
        aria-label="Search devices, logs and users"
        autoComplete="off"
        value={query}
        placeholder="Search devices, logs, users..."
        onFocus={() => {
          setIsOpen(true);
          ensureData();
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          ensureData();
        }}
        onKeyDown={handleKeyDown}
        className="w-full bg-zinc-100/50 dark:bg-white/[0.03] border border-zinc-200/50 dark:border-white/[0.08] rounded-xl py-2 pl-10 pr-16 text-sm outline-none focus:border-cemo-primary/50 focus:ring-1 focus:ring-cemo-primary/50 transition-all"
      />
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded-md border border-zinc-200 dark:border-white/10 bg-white/60 dark:bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-bold text-zinc-400">
          Ctrl K
        </kbd>
      </div>

      {showPanel && (
        <div
          id="global-search-results"
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 z-50 max-h-[420px] overflow-y-auto rounded-2xl border border-zinc-200 dark:border-white/10 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-2xl p-2"
        >
          {error ? (
            <div className="flex items-center gap-3 px-3 py-4 text-xs text-red-500">
              <HugeiconsIcon icon={AlertCircleIcon} className="size-4 shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          ) : results.length === 0 ? (
            <div className="px-3 py-6 text-center">
              <p className="text-xs font-bold text-zinc-500">
                {loading ? "Indexing records..." : `No matches for "${query.trim()}"`}
              </p>
              {!loading && (
                <p className="text-[11px] text-zinc-400 mt-1">
                  Try a name, email, establishment or date.
                </p>
              )}
            </div>
          ) : (
            groups.map(([kind, items]) => (
              <div key={kind} className="mb-1 last:mb-0">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                  {SEARCH_KIND_LABELS[kind]}
                </p>
                {items.map((result) => {
                  flatIndex += 1;
                  const isActive = flatIndex === activeIndex;
                  const optionIndex = flatIndex;

                  return (
                    <button
                      key={result.id}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      onMouseEnter={() => setActiveIndex(optionIndex)}
                      onClick={() => goTo(result)}
                      className={cn(
                        "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                        isActive
                          ? "bg-cemo-primary/10 text-zinc-900 dark:text-white"
                          : "hover:bg-zinc-100 dark:hover:bg-white/5",
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                          isActive
                            ? "border-cemo-primary/30 bg-cemo-primary/15 text-cemo-primary"
                            : "border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/5 text-zinc-400",
                        )}
                      >
                        <HugeiconsIcon icon={KIND_ICONS[result.kind]} className="size-4" />
                      </div>
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-bold text-zinc-900 dark:text-white">
                          {result.title}
                        </span>
                        <span className="truncate text-[11px] text-zinc-500">{result.subtitle}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
