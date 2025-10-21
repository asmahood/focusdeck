import { CardColumn, SkeletonCard } from "@/components";

export default function DashboardLoading() {
  return (
    <div className="h-screen overflow-hidden bg-neutral-950 p-4">
      <div className="flex h-[calc(100vh-2rem)] gap-3 lg:grid lg:grid-cols-4">
        {["Issues Created", "Issues Assigned", "Pull Requests", "Review Requests"].map((title) => (
          <CardColumn key={title} title={title} count={0}>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </CardColumn>
        ))}
      </div>
    </div>
  );
}
