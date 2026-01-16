"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { CardColumn } from "./CardColumn";
import { Card } from "./Card";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";
import { SkeletonCard } from "./SkeletonCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useIssuesCreated } from "@/hooks/useIssuesCreated";
import { useIssuesAssigned } from "@/hooks/useIssuesAssigned";
import { usePullRequests } from "@/hooks/usePullRequests";
import { useReviewRequests } from "@/hooks/useReviewRequests";
import { useSSESubscription } from "@/contexts/SSEContext";
import { FetchResult } from "@/lib/fetchers/types";
import type { CardData } from "@/types/card";

interface DashboardColumnProps {
  title: string;
  initialData: FetchResult;
  columnType: "issues-created" | "issues-assigned" | "prs" | "reviews";
}

/** Duration of the highlight animation in milliseconds */
const HIGHLIGHT_DURATION_MS = 2000;

export function DashboardColumn({ title, initialData, columnType }: DashboardColumnProps) {
  // Track newly added items for highlight animation
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());

  // Track highlight timeouts for cleanup
  const highlightTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Hook selection based on column type
  const hookMap = {
    "issues-created": useIssuesCreated,
    "issues-assigned": useIssuesAssigned,
    prs: usePullRequests,
    reviews: useReviewRequests,
  };

  const useColumnData = hookMap[columnType as keyof typeof hookMap] || useIssuesCreated;
  const { items, totalCount, pageInfo, isLoading, error, loadMore, prependItem } = useColumnData({
    initialData,
  });

  // Handle new items from SSE
  const handleNewItem = useCallback(
    (item: CardData) => {
      prependItem(item);

      // Clear existing timeout for this item if any (handles rapid updates)
      const existingTimeout = highlightTimeoutsRef.current.get(item.id);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Add to highlighted set
      setHighlightedIds((prev) => new Set([...prev, item.id]));

      // Remove highlight after animation completes
      const timeoutId = setTimeout(() => {
        setHighlightedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        highlightTimeoutsRef.current.delete(item.id);
      }, HIGHLIGHT_DURATION_MS);

      highlightTimeoutsRef.current.set(item.id, timeoutId);
    },
    [prependItem],
  );

  // Subscribe to real-time updates via shared SSE context
  useSSESubscription(columnType, handleNewItem);

  const { sentinelRef } = useInfiniteScroll({
    hasNextPage: pageInfo.hasNextPage,
    isLoading,
    onLoadMore: loadMore,
  });

  // Cleanup highlight timeouts on unmount
  useEffect(() => {
    const timeouts = highlightTimeoutsRef.current;
    return () => {
      timeouts.forEach(clearTimeout);
      timeouts.clear();
    };
  }, []);

  // Show initial loading state
  if (items.length === 0 && isLoading) {
    return (
      <CardColumn title={title} count={0}>
        <SkeletonCard />
        <div className="mt-2">
          <SkeletonCard />
        </div>
        <div className="mt-2">
          <SkeletonCard />
        </div>
      </CardColumn>
    );
  }

  // Show empty state if no items, no error, and not loading
  if (items.length === 0 && !error && !isLoading) {
    const getEmptyStateMessage = () => {
      switch (columnType) {
        case "issues-created":
          return {
            title: "No open issues found",
            description: "Create your first issue to get started",
          };
        case "issues-assigned":
          return {
            title: "No assigned issues found",
            description: "Issues assigned to you will appear here",
          };
        case "prs":
          return {
            title: "No open pull requests found",
            description: "Create your first pull request to get started",
          };
        case "reviews":
          return {
            title: "No review requests found",
            description: "Pull requests awaiting your review will appear here",
          };
        default:
          return { title: "No items found", description: "" };
      }
    };

    const emptyMessage = getEmptyStateMessage();
    return (
      <CardColumn title={title} count={0}>
        <EmptyState title={emptyMessage.title} description={emptyMessage.description} />
      </CardColumn>
    );
  }

  // Show error state if initial load failed
  if (items.length === 0 && error) {
    return (
      <CardColumn title={title} count={0}>
        <ErrorState error={error} onRetry={loadMore} />
      </CardColumn>
    );
  }

  return (
    <CardColumn title={title} count={totalCount}>
      {items.map((card, index) => {
        const isHighlighted = highlightedIds.has(card.id);
        const shouldFadeIn = index < 10 && !isHighlighted;

        return (
          <div
            key={card.id}
            className={`${shouldFadeIn ? "animate-fadeIn" : ""} ${isHighlighted ? "animate-highlight rounded-lg" : ""}`}
            style={shouldFadeIn ? { animationDelay: `${index * 50}ms` } : undefined}
          >
            <Card data={card} />
          </div>
        );
      })}

      {/* Infinite scroll sentinel */}
      {pageInfo.hasNextPage && (
        <div ref={sentinelRef} className="py-4">
          {isLoading ? (
            <>
              <SkeletonCard />
              <div className="mt-2">
                <SkeletonCard />
              </div>
            </>
          ) : (
            <div role="status" aria-live="polite" className="text-center text-xs text-neutral-500">
              Scroll for more
            </div>
          )}
        </div>
      )}

      {/* Error state for loading more */}
      {error && <ErrorState error={error} onRetry={loadMore} inline />}
    </CardColumn>
  );
}
