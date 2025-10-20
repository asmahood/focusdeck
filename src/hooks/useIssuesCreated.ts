"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { CardData } from "@/types/card";
import { FetchResult } from "@/lib/fetchers/types";
import { AppError, createAppError } from "@/types/errors";

interface UseIssuesCreatedProps {
  initialData: FetchResult;
}

/**
 * Custom hook for fetching and managing GitHub issues with cursor-based pagination
 *
 * @param initialData - Initial data to populate the hook with (from SSR or initial fetch)
 *
 * @returns Object containing items, pagination info, loading state, error state, and loadMore function
 *
 * @example
 * ```tsx
 * const { items, pageInfo, isLoading, error, loadMore } = useIssuesCreated({
 *   initialData
 * });
 *
 * const { sentinelRef } = useInfiniteScroll({
 *   hasNextPage: pageInfo.hasNextPage,
 *   isLoading,
 *   onLoadMore: loadMore
 * });
 * ```
 */
export function useIssuesCreated({ initialData }: UseIssuesCreatedProps) {
  const [items, setItems] = useState<CardData[]>(initialData.items);
  const [pageInfo, setPageInfo] = useState(initialData.pageInfo);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  // Refs to prevent stale closures and race conditions
  const loadingRef = useRef(false);
  const sequenceRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const loadMore = useCallback(async () => {
    if (!pageInfo.hasNextPage || loadingRef.current) return;

    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    loadingRef.current = true;
    setIsLoading(true);
    setError(null);

    const currentSequence = ++sequenceRef.current;

    try {
      const url = pageInfo.endCursor
        ? `/api/issues/created?cursor=${encodeURIComponent(pageInfo.endCursor)}`
        : "/api/issues/created";

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw createAppError("NETWORK_ERROR", `Failed to fetch: ${response.statusText}`, true);
      }

      const data = await response.json();

      // Validate response shape
      if (!data || typeof data !== "object" || !Array.isArray(data.items)) {
        throw createAppError("UNKNOWN", "Invalid response format from server", false);
      }

      const result = data as FetchResult;

      // Ignore if a newer request has started
      if (currentSequence !== sequenceRef.current) return;

      if (result.error) {
        setError(result.error);
        return;
      }

      setItems((prev) => [...prev, ...result.items]);
      setPageInfo(result.pageInfo);
    } catch (err) {
      // Don't set error if request was aborted
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }

      // Only set error if this is still the latest request
      if (currentSequence === sequenceRef.current) {
        const appError =
          err instanceof Error
            ? createAppError("NETWORK_ERROR", err.message, true)
            : createAppError("UNKNOWN", "An unexpected error occurred", true);
        setError(appError);
      }
    } finally {
      if (currentSequence === sequenceRef.current) {
        setIsLoading(false);
        loadingRef.current = false;
      }
    }
  }, [pageInfo]);

  // Cleanup: abort any in-flight requests on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return useMemo(
    () => ({
      items,
      pageInfo,
      isLoading,
      error,
      loadMore,
    }),
    [items, pageInfo, isLoading, error, loadMore],
  );
}
