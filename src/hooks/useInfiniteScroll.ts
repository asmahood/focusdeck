"use client";

import { useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions {
  hasNextPage: boolean;
  isLoading: boolean;
  onLoadMore: () => void | Promise<void>;
  threshold?: number;
}

/**
 * Custom hook for infinite scroll functionality using IntersectionObserver
 *
 * @param hasNextPage - Whether more data is available to load
 * @param isLoading - Whether a load operation is currently in progress
 * @param onLoadMore - Callback to invoke when more data should be loaded
 * @param threshold - Distance in pixels from the sentinel to trigger loading (default: 200)
 *
 * @returns Object containing sentinelRef to attach to the scroll sentinel element
 *
 * @example
 * ```tsx
 * const { sentinelRef } = useInfiniteScroll({
 *   hasNextPage: pageInfo.hasNextPage,
 *   isLoading,
 *   onLoadMore: loadMore,
 *   threshold: 300
 * });
 *
 * return (
 *   <>
 *     {items.map(item => <Item key={item.id} {...item} />)}
 *     <div ref={sentinelRef} />
 *   </>
 * );
 * ```
 */
export function useInfiniteScroll({ hasNextPage, isLoading, onLoadMore, threshold = 200 }: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const callbackRef = useRef(onLoadMore);

  // Keep callback ref updated without recreating observer
  useEffect(() => {
    callbackRef.current = onLoadMore;
  }, [onLoadMore]);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isLoading) {
        callbackRef.current();
      }
    },
    [hasNextPage, isLoading],
  );

  useEffect(() => {
    if (!sentinelRef.current) return;

    observerRef.current = new IntersectionObserver(handleIntersection, {
      rootMargin: `${threshold}px`,
    });

    observerRef.current.observe(sentinelRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [handleIntersection, threshold]);

  return { sentinelRef };
}
