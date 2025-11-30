import { renderHook, waitFor, act } from "@testing-library/react";
import { useReviewRequests } from "../useReviewRequests";

global.fetch = jest.fn();

describe("useReviewRequests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with initial data", () => {
    const initialData = {
      items: [
        {
          id: "1",
          title: "Test Review Request",
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

    const { result } = renderHook(() => useReviewRequests({ initialData }));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.totalCount).toBe(1);
    expect(result.current.pageInfo.hasNextPage).toBe(true);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
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
          title: "New Review Request",
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

    const { result } = renderHook(() => useReviewRequests({ initialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].title).toBe("New Review Request");
      expect(result.current.items[0].status).toBe("draft");
    });
  });

  it("should not load more when hasNextPage is false", async () => {
    const initialData = {
      items: [
        {
          id: "1",
          title: "Test Review Request",
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
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    const { result } = renderHook(() => useReviewRequests({ initialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should handle fetch errors", async () => {
    const initialData = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: true, endCursor: "cursor123" },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error",
    });

    const { result } = renderHook(() => useReviewRequests({ initialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toMatchObject({
        type: "NETWORK_ERROR",
        message: expect.stringContaining("Failed to fetch"),
        retryable: true,
      });
    });
  });

  it("should handle invalid response format", async () => {
    const initialData = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: true, endCursor: "cursor123" },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ invalid: "response" }),
    });

    const { result } = renderHook(() => useReviewRequests({ initialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toMatchObject({
        type: "NETWORK_ERROR",
        message: "Invalid response format from server",
      });
    });
  });

  it("should append new items to existing items", async () => {
    const initialData = {
      items: [
        {
          id: "1",
          title: "First Review Request",
          status: "open" as const,
          labels: [],
          repository: { owner: "test", name: "repo" },
          number: 1,
          createdAt: "2024-01-15T10:00:00Z",
          commentCount: 0,
          url: "https://github.com/test/repo/pull/1",
        },
      ],
      totalCount: 2,
      pageInfo: { hasNextPage: true, endCursor: "cursor123" },
    };

    const newData = {
      items: [
        {
          id: "2",
          title: "Second Review Request",
          status: "open" as const,
          labels: [],
          repository: { owner: "test", name: "repo" },
          number: 2,
          createdAt: "2024-01-16T10:00:00Z",
          commentCount: 0,
          url: "https://github.com/test/repo/pull/2",
        },
      ],
      totalCount: 2,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => newData,
    });

    const { result } = renderHook(() => useReviewRequests({ initialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[0].title).toBe("First Review Request");
      expect(result.current.items[1].title).toBe("Second Review Request");
    });
  });

  it("should set loading state during fetch", async () => {
    const initialData = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: true, endCursor: "cursor123" },
    };

    let resolvePromise: (value: unknown) => void;
    const fetchPromise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValue(fetchPromise);

    const { result } = renderHook(() => useReviewRequests({ initialData }));

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });

    act(() => {
      resolvePromise({
        ok: true,
        json: async () => ({
          items: [],
          totalCount: 0,
          pageInfo: { hasNextPage: false, endCursor: null },
        }),
      });
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should use correct API endpoint with cursor", async () => {
    const initialData = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: true, endCursor: "cursor123" },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        items: [],
        totalCount: 0,
        pageInfo: { hasNextPage: false, endCursor: null },
      }),
    });

    const { result } = renderHook(() => useReviewRequests({ initialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(global.fetch).toHaveBeenCalledWith("/api/review-requests?cursor=cursor123", expect.any(Object));
  });

  it("should abort previous request when new loadMore is called", async () => {
    const initialData = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: true, endCursor: "cursor123" },
    };

    const abortedErrors: Error[] = [];
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error("Aborted");
            error.name = "AbortError";
            abortedErrors.push(error);
            reject(error);
          }, 100);
        }),
    );

    const { result } = renderHook(() => useReviewRequests({ initialData }));

    act(() => {
      result.current.loadMore();
    });

    act(() => {
      result.current.loadMore();
    });

    await waitFor(
      () => {
        expect(abortedErrors.length).toBeGreaterThan(0);
      },
      { timeout: 200 },
    );
  });

  it("should handle error responses from API", async () => {
    const initialData = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: true, endCursor: "cursor123" },
    };

    const errorResponse = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: false, endCursor: null },
      error: {
        type: "RATE_LIMIT",
        message: "Rate limit exceeded",
        retryable: true,
        retryAfter: 3600,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => errorResponse,
    });

    const { result } = renderHook(() => useReviewRequests({ initialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toMatchObject({
        type: "RATE_LIMIT",
        message: "Rate limit exceeded",
        retryable: true,
        retryAfter: 3600,
      });
    });
  });
});
