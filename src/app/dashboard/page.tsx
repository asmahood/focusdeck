import { DashboardColumn } from "@/components";
import { fetchIssuesCreated, fetchIssuesAssigned, fetchPullRequests } from "@/lib/fetchers";
import { mockReviewRequests } from "@/data/mockCards";
import { FetchResult } from "@/lib/fetchers/types";

export default async function DashboardPage() {
  // Fetch initial data server-side with error handling
  const [issuesCreatedData, issuesAssignedData, pullRequestsData] = await Promise.allSettled([
    fetchIssuesCreated({ first: 20 }),
    fetchIssuesAssigned({ first: 20 }),
    fetchPullRequests({ first: 20 }),
  ]).then((results) => {
    const emptyResult: FetchResult = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    return [
      results[0].status === "fulfilled" ? results[0].value : emptyResult,
      results[1].status === "fulfilled" ? results[1].value : emptyResult,
      results[2].status === "fulfilled" ? results[2].value : emptyResult,
    ];
  });

  // Convert mock data to FetchResult format for remaining column (temporary)
  const mockDataAsResult = (items: typeof mockReviewRequests): FetchResult => ({
    items,
    totalCount: items.length,
    pageInfo: { hasNextPage: false, endCursor: null },
  });

  return (
    <div className="h-screen overflow-hidden bg-neutral-950 p-4">
      {/* Desktop: 4 column grid, no page scroll */}
      {/* Tablet: horizontal scroll with 2 visible columns */}
      {/* Mobile: single column with horizontal snap scroll */}
      <div className="snap-container flex h-[calc(100vh-2rem)] gap-3 overflow-x-auto rounded-lg md:overflow-x-auto lg:grid lg:grid-cols-4 lg:gap-0 lg:overflow-x-hidden">
        {/* Issues Created Column */}
        <div className="snap-item">
          <DashboardColumn title="Issues Created" initialData={issuesCreatedData} columnType="issues-created" />
        </div>

        {/* Issues Assigned Column */}
        <div className="snap-item">
          <DashboardColumn title="Issues Assigned" initialData={issuesAssignedData} columnType="issues-assigned" />
        </div>

        {/* Pull Requests Column */}
        <div className="snap-item">
          <DashboardColumn title="Pull Requests" initialData={pullRequestsData} columnType="prs" />
        </div>

        {/* Review Requests Column */}
        <div className="snap-item">
          <DashboardColumn
            title="Review Requests"
            initialData={mockDataAsResult(mockReviewRequests)}
            columnType="reviews"
          />
        </div>
      </div>
    </div>
  );
}
