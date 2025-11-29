import { renderHook, waitFor, act } from "@testing-library/react";
import { usePullRequests } from "../usePullRequests";

global.fetch = jest.fn();

describe("usePullRequests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with initial data", () => {
    const initialData = {
      items: [
        {
          id: "1",
          title: "Test PR",
          status: "open" as const,
          labels: [],
          repository: { owner: "test", name: "repo" },
          number: 1,
          createdAt: "2024-01-15T10:00:00Z",
          commentCount: 0,
          url: "https://github.com/test/repo/pull/1",
        },
      ],
      totalCount: 1,
      pageInfo: { hasNextPage: true, endCursor: "cursor123" },
    };

    const { result } = renderHook(() => usePullRequests({ initialData }));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.pageInfo.hasNextPage).toBe(true);
  });

  it("should load more data when loadMore is called", async () => {
    const initialData = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: true, endCursor: "cursor123" },
    };

    const newData = {
      items: [
        {
          id: "2",
          title: "New PR",
          status: "draft" as const,
          labels: [],
          repository: { owner: "test", name: "repo" },
          number: 2,
          createdAt: "2024-01-15T10:00:00Z",
          commentCount: 0,
          url: "https://github.com/test/repo/pull/2",
        },
      ],
      totalCount: 1,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => newData,
    });

    const { result } = renderHook(() => usePullRequests({ initialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].title).toBe("New PR");
      expect(result.current.items[0].status).toBe("draft");
    });
  });
});
