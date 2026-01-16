import { DashboardColumn, DashboardHeader, DashboardContent } from "@/components";
import { fetchIssuesCreated, fetchIssuesAssigned, fetchPullRequests, fetchReviewRequests } from "@/lib/fetchers";
import { FetchResult } from "@/lib/fetchers/types";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { AppError } from "@/types/errors";

export default async function HomePage() {
  // Get session for header user info
  const session = await auth();

  // Redirect to sign-in if not authenticated
  if (!session?.user || session.error === "RefreshTokenError") {
    redirect("/sign-in");
  }

  // Fetch initial data server-side with error handling
  const results = await Promise.allSettled([
    fetchIssuesCreated({ first: 20 }),
    fetchIssuesAssigned({ first: 20 }),
    fetchPullRequests({ first: 20 }),
    fetchReviewRequests({ first: 20 }),
  ]);

  // Check if any fetch failed with an auth error - if so, redirect to sign-in
  const authError = results.find(
    (result) => result.status === "rejected" && (result.reason as AppError)?.type === "AUTH_ERROR",
  );
  if (authError) {
    redirect("/sign-in");
  }

  const emptyResult: FetchResult = {
    items: [],
    totalCount: 0,
    pageInfo: { hasNextPage: false, endCursor: null },
  };

  const [issuesCreatedData, issuesAssignedData, pullRequestsData, reviewRequestsData] = [
    results[0].status === "fulfilled" ? results[0].value : emptyResult,
    results[1].status === "fulfilled" ? results[1].value : emptyResult,
    results[2].status === "fulfilled" ? results[2].value : emptyResult,
    results[3].status === "fulfilled" ? results[3].value : emptyResult,
  ];

  return (
    <DashboardContent>
      <div className="flex h-screen flex-col overflow-hidden bg-neutral-950">
        {/* Dashboard Header */}
        <DashboardHeader user={session?.user || {}} />

        {/* Dashboard Columns */}
        <div className="flex-1 overflow-hidden p-4">
          {/* Desktop: 4 column grid, no page scroll */}
          {/* Tablet: horizontal scroll with 2 visible columns */}
          {/* Mobile: single column with horizontal snap scroll */}
          <div className="snap-container flex h-full gap-3 overflow-x-auto rounded-lg md:overflow-x-auto lg:grid lg:grid-cols-4 lg:gap-0 lg:overflow-x-hidden">
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
              <DashboardColumn title="Review Requests" initialData={reviewRequestsData} columnType="reviews" />
            </div>
          </div>
        </div>
      </div>
    </DashboardContent>
  );
}
