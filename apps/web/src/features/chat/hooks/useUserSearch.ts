import { useEffect, useState } from "react";
import { searchUsers } from "../../users/usersService";
import type { UserPublicInfo } from "../../../shared/types/messages";

interface UseUserSearchResult {
  results: UserPublicInfo[];
  loading: boolean;
  error: string | null;
}

export function useUserSearch(query: string): UseUserSearchResult {
  const [results, setResults] = useState<UserPublicInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setResults([]);
      setError(null);
      return;
    }

    const controller = new AbortController();

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchUsers(q, controller.signal)
        .then(setResults)
        .catch((err: unknown) => {
          if ((err as { name?: string }).name === "AbortError") return;
          setError(err instanceof Error ? err.message : "Search failed.");
        })
        .finally(() => setLoading(false));
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return { results, loading, error };
}
