"use client";

import { CardColumn } from "./CardColumn";
import { Card } from "./Card";
import { ErrorState } from "./ErrorState";
import { EmptyState } from "./EmptyState";
import { SkeletonCard } from "./SkeletonCard";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { useIssuesCreated } from "@/hooks/useIssuesCreated";
import { FetchResult } from "@/lib/fetchers/types";

interface DashboardColumnProps {
  title: string;
  initialData: FetchResult;
  columnType: "issues-created" | "issues-assigned" | "prs" | "reviews";
}

export function DashboardColumn({
  title,
  initialData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  columnType,
}: DashboardColumnProps) {
  // TODO: Make this dynamic based on columnType
  const { items, totalCount, pageInfo, isLoading, error, loadMore } = useIssuesCreated({
    initialData,
  });

  const { sentinelRef } = useInfiniteScroll({
    hasNextPage: pageInfo.hasNextPage,
    isLoading,
    onLoadMore: loadMore,
  });

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
    return (
      <CardColumn title={title} count={0}>
        <EmptyState title="No open issues found" description="Create your first issue to get started" />
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
      {items.map((card, index) => (
        <div
          key={card.id}
          className={index < 10 ? "animate-fadeIn" : ""}
          style={index < 10 ? { animationDelay: `${index * 50}ms` } : undefined}
        >
          <Card data={card} />
        </div>
      ))}

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
