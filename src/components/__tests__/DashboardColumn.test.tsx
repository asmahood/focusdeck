import { render, screen } from "@testing-library/react";
import { DashboardColumn } from "../DashboardColumn";
import { useIssuesCreated } from "@/hooks/useIssuesCreated";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import { FetchResult } from "@/lib/fetchers/types";
import { CardData } from "@/types/card";

// Mock the hooks
jest.mock("@/hooks/useIssuesCreated");
jest.mock("@/hooks/useInfiniteScroll");

const mockUseIssuesCreated = useIssuesCreated as jest.MockedFunction<typeof useIssuesCreated>;
const mockUseInfiniteScroll = useInfiniteScroll as jest.MockedFunction<typeof useInfiniteScroll>;

describe("DashboardColumn", () => {
  const mockCardData: CardData[] = [
    {
      id: "1",
      title: "Test issue 1",
      status: "open",
      labels: [{ name: "bug", color: "d73a4a" }],
      repository: { owner: "test", name: "repo" },
      number: 1,
      createdAt: "2024-01-15T10:00:00Z",
      commentCount: 5,
      url: "https://github.com/test/repo/issues/1",
    },
    {
      id: "2",
      title: "Test issue 2",
      status: "open",
      labels: [],
      repository: { owner: "test", name: "repo" },
      number: 2,
      createdAt: "2024-01-16T10:00:00Z",
      commentCount: 0,
      url: "https://github.com/test/repo/issues/2",
    },
  ];

  const mockInitialData: FetchResult = {
    items: mockCardData,
    pageInfo: {
      hasNextPage: true,
      endCursor: "cursor123",
    },
  };

  beforeEach(() => {
    // Default mock implementation
    mockUseIssuesCreated.mockReturnValue({
      items: mockCardData,
      totalCount: mockCardData.length,
      pageInfo: {
        hasNextPage: true,
        endCursor: "cursor123",
      },
      isLoading: false,
      error: null,
      loadMore: jest.fn(),
    });

    mockUseInfiniteScroll.mockReturnValue({
      sentinelRef: { current: null },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should render column title and items", () => {
    render(<DashboardColumn title="Issues Created" initialData={mockInitialData} columnType="issues-created" />);

    expect(screen.getByText("Issues Created")).toBeInTheDocument();
    expect(screen.getByText("Test issue 1")).toBeInTheDocument();
    expect(screen.getByText("Test issue 2")).toBeInTheDocument();
  });

  it("should display item count in header", () => {
    const { container } = render(
      <DashboardColumn title="Issues Created" initialData={mockInitialData} columnType="issues-created" />,
    );

    // Check for count badge
    const countBadge = container.querySelector(".inline-flex.rounded-full.bg-neutral-800");
    expect(countBadge).toBeInTheDocument();
    expect(countBadge?.textContent).toBe("2");
  });

  it("should show empty state when no items", () => {
    mockUseIssuesCreated.mockReturnValue({
      items: [],
      totalCount: 0,
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
      isLoading: false,
      error: null,
      loadMore: jest.fn(),
    });

    render(
      <DashboardColumn
        title="Issues Created"
        initialData={{
          items: [],
          pageInfo: { hasNextPage: false, endCursor: null },
        }}
        columnType="issues-created"
      />,
    );

    expect(screen.getByText("No open issues found")).toBeInTheDocument();
    expect(screen.getByText("Create your first issue to get started")).toBeInTheDocument();
  });

  it("should show loading skeleton when loading more", () => {
    mockUseIssuesCreated.mockReturnValue({
      items: mockCardData,
      totalCount: mockCardData.length,
      pageInfo: {
        hasNextPage: true,
        endCursor: "cursor123",
      },
      isLoading: true,
      error: null,
      loadMore: jest.fn(),
    });

    render(<DashboardColumn title="Issues Created" initialData={mockInitialData} columnType="issues-created" />);

    // Check for skeleton cards (they have animate-pulse class)
    const skeletons = document.querySelectorAll(".animate-pulse");
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should show "Scroll for more" when not loading and has next page', () => {
    render(<DashboardColumn title="Issues Created" initialData={mockInitialData} columnType="issues-created" />);

    expect(screen.getByText("Scroll for more")).toBeInTheDocument();
  });

  it("should not show sentinel when hasNextPage is false", () => {
    mockUseIssuesCreated.mockReturnValue({
      items: mockCardData,
      totalCount: mockCardData.length,
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
      isLoading: false,
      error: null,
      loadMore: jest.fn(),
    });

    render(<DashboardColumn title="Issues Created" initialData={mockInitialData} columnType="issues-created" />);

    expect(screen.queryByText("Scroll for more")).not.toBeInTheDocument();
  });

  it("should show error state when there is an error", () => {
    const mockError = {
      type: "NETWORK_ERROR" as const,
      message: "Failed to load more issues",
      retryable: true,
      name: "AppError",
    };

    mockUseIssuesCreated.mockReturnValue({
      items: mockCardData,
      totalCount: mockCardData.length,
      pageInfo: {
        hasNextPage: true,
        endCursor: "cursor123",
      },
      isLoading: false,
      error: mockError,
      loadMore: jest.fn(),
    });

    render(<DashboardColumn title="Issues Created" initialData={mockInitialData} columnType="issues-created" />);

    expect(screen.getByText("Failed to load more issues")).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("should call useInfiniteScroll with correct parameters", () => {
    const mockLoadMore = jest.fn();
    mockUseIssuesCreated.mockReturnValue({
      items: mockCardData,
      totalCount: mockCardData.length,
      pageInfo: {
        hasNextPage: true,
        endCursor: "cursor123",
      },
      isLoading: false,
      error: null,
      loadMore: mockLoadMore,
    });

    render(<DashboardColumn title="Issues Created" initialData={mockInitialData} columnType="issues-created" />);

    expect(mockUseInfiniteScroll).toHaveBeenCalledWith({
      hasNextPage: true,
      isLoading: false,
      onLoadMore: mockLoadMore,
    });
  });

  it("should render labels for cards that have them", () => {
    render(<DashboardColumn title="Issues Created" initialData={mockInitialData} columnType="issues-created" />);

    expect(screen.getByText("bug")).toBeInTheDocument();
  });

  it("should render repository information", () => {
    render(<DashboardColumn title="Issues Created" initialData={mockInitialData} columnType="issues-created" />);

    // CardColumn should show repository info (test/repo)
    const repoText = screen.getAllByText(/test\/repo/);
    expect(repoText.length).toBeGreaterThan(0);
  });

  it("should apply fade-in animation to cards", () => {
    const { container } = render(
      <DashboardColumn title="Issues Created" initialData={mockInitialData} columnType="issues-created" />,
    );

    const animatedDivs = container.querySelectorAll(".animate-fadeIn");
    expect(animatedDivs.length).toBe(mockCardData.length);
  });

  it("should handle rate limit error with countdown", () => {
    const mockRateLimitError = {
      type: "RATE_LIMIT" as const,
      message: "Rate limit exceeded",
      retryable: true,
      retryAfter: 3600,
      name: "AppError",
    };

    mockUseIssuesCreated.mockReturnValue({
      items: mockCardData,
      totalCount: mockCardData.length,
      pageInfo: {
        hasNextPage: true,
        endCursor: "cursor123",
      },
      isLoading: false,
      error: mockRateLimitError,
      loadMore: jest.fn(),
    });

    render(<DashboardColumn title="Issues Created" initialData={mockInitialData} columnType="issues-created" />);

    expect(screen.getByText("Rate limit exceeded")).toBeInTheDocument();
    // The countdown should be displayed (format: "Retrying in Xs...")
    expect(screen.getByText(/Retrying in \d+s\.\.\./)).toBeInTheDocument();
  });
});
