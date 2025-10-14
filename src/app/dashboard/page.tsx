import { Card, CardColumn } from "@/components";
import { mockIssuesCreated, mockIssuesAssigned, mockPullRequests, mockReviewRequests } from "@/data/mockCards";

export default function DashboardPage() {
  return (
    <div className="h-screen overflow-hidden bg-neutral-950 p-4">
      {/* Desktop: 4 column grid, no page scroll */}
      {/* Tablet: horizontal scroll with 2 visible columns */}
      {/* Mobile: single column with horizontal snap scroll */}
      <div className="snap-container flex h-[calc(100vh-2rem)] gap-3 overflow-x-auto rounded-lg md:overflow-x-auto lg:grid lg:grid-cols-4 lg:gap-0 lg:overflow-x-hidden">
        {/* Issues Created Column */}
        <div className="snap-item">
          <CardColumn title="Issues Created" count={mockIssuesCreated.length}>
            {mockIssuesCreated.map((card, index) => (
              <div key={card.id} className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
                <Card data={card} />
              </div>
            ))}
          </CardColumn>
        </div>

        {/* Issues Assigned Column */}
        <div className="snap-item">
          <CardColumn title="Issues Assigned" count={mockIssuesAssigned.length}>
            {mockIssuesAssigned.map((card, index) => (
              <div key={card.id} className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
                <Card data={card} />
              </div>
            ))}
          </CardColumn>
        </div>

        {/* Pull Requests Column */}
        <div className="snap-item">
          <CardColumn title="Pull Requests" count={mockPullRequests.length}>
            {mockPullRequests.map((card, index) => (
              <div key={card.id} className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
                <Card data={card} />
              </div>
            ))}
          </CardColumn>
        </div>

        {/* Review Requests Column */}
        <div className="snap-item">
          <CardColumn title="Review Requests" count={mockReviewRequests.length}>
            {mockReviewRequests.map((card, index) => (
              <div key={card.id} className="animate-fadeIn" style={{ animationDelay: `${index * 50}ms` }}>
                <Card data={card} />
              </div>
            ))}
          </CardColumn>
        </div>
      </div>
    </div>
  );
}
