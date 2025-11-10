import { DashboardColumn } from "@/components";
import { fetchIssuesCreated } from "@/lib/fetchers";
import { mockIssuesAssigned, mockPullRequests, mockReviewRequests } from "@/data/mockCards";
import { FetchResult } from "@/lib/fetchers/types";

export default async function DashboardPage() {
  // Fetch initial data server-side
  const issuesCreatedData = await fetchIssuesCreated({ first: 20 });

  // Convert mock data to FetchResult format for other columns (temporary)
  const mockDataAsResult = (items: typeof mockIssuesAssigned): FetchResult => ({
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
          <DashboardColumn
            title="Issues Assigned"
            initialData={mockDataAsResult(mockIssuesAssigned)}
            columnType="issues-assigned"
          />
        </div>

        {/* Pull Requests Column */}
        <div className="snap-item">
          <DashboardColumn title="Pull Requests" initialData={mockDataAsResult(mockPullRequests)} columnType="prs" />
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
