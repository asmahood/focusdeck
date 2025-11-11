import { renderHook, waitFor, act } from "@testing-library/react";
import { useIssuesAssigned } from "../useIssuesAssigned";
import { FetchResult } from "@/lib/fetchers/types";

// Mock fetch globally
global.fetch = jest.fn();

describe("useIssuesAssigned", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const mockInitialData: FetchResult = {
    items: [
      {
        id: "1",
        title: "Test assigned issue",
        status: "open" as const,
        labels: [],
        repository: { owner: "test", name: "repo" },
        number: 1,
        createdAt: "2024-01-15T10:00:00Z",
        commentCount: 0,
        url: "https://github.com/test/repo/issues/1",
      },
    ],
    totalCount: 1,
    pageInfo: { hasNextPage: true, endCursor: "cursor123" },
  };

  it("should initialize with initial data", () => {
    const { result } = renderHook(() => useIssuesAssigned({ initialData: mockInitialData }));

    expect(result.current.items).toHaveLength(1);
    expect(result.current.items[0].title).toBe("Test assigned issue");
    expect(result.current.totalCount).toBe(1);
    expect(result.current.pageInfo.hasNextPage).toBe(true);
    expect(result.current.pageInfo.endCursor).toBe("cursor123");
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should load more data when loadMore is called", async () => {
    const newData: FetchResult = {
      items: [
        {
          id: "2",
          title: "New assigned issue",
          status: "open" as const,
          labels: [],
          repository: { owner: "test", name: "repo" },
          number: 2,
          createdAt: "2024-01-16T10:00:00Z",
          commentCount: 0,
          url: "https://github.com/test/repo/issues/2",
        },
      ],
      totalCount: 2,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => newData,
    });

    const { result } = renderHook(() => useIssuesAssigned({ initialData: mockInitialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[1].title).toBe("New assigned issue");
      expect(result.current.totalCount).toBe(2);
      expect(result.current.pageInfo.hasNextPage).toBe(false);
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should not load more when hasNextPage is false", async () => {
    const dataWithoutNextPage: FetchResult = {
      ...mockInitialData,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    const { result } = renderHook(() => useIssuesAssigned({ initialData: dataWithoutNextPage }));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should not load more when already loading", async () => {
    const newData: FetchResult = {
      items: [
        {
          id: "2",
          title: "New issue",
          status: "open" as const,
          labels: [],
          repository: { owner: "test", name: "repo" },
          number: 2,
          createdAt: "2024-01-16T10:00:00Z",
          commentCount: 0,
          url: "https://github.com/test/repo/issues/2",
        },
      ],
      totalCount: 2,
      pageInfo: { hasNextPage: true, endCursor: "cursor456" },
    };

    // Delay the response to simulate slow network
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => newData,
              }),
            100,
          ),
        ),
    );

    const { result } = renderHook(() => useIssuesAssigned({ initialData: mockInitialData }));

    // Call loadMore twice in quick succession
    act(() => {
      void result.current.loadMore();
      void result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only be called once despite two loadMore calls
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should handle fetch errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      statusText: "Internal Server Error",
    });

    const { result } = renderHook(() => useIssuesAssigned({ initialData: mockInitialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.type).toBe("NETWORK_ERROR");
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should handle network errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(() => useIssuesAssigned({ initialData: mockInitialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.type).toBe("NETWORK_ERROR");
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should handle API errors in response", async () => {
    const errorResponse: FetchResult = {
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

    const { result } = renderHook(() => useIssuesAssigned({ initialData: mockInitialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.type).toBe("RATE_LIMIT");
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should handle invalid response format", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ invalid: "response" }),
    });

    const { result } = renderHook(() => useIssuesAssigned({ initialData: mockInitialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      // The validation check throws createAppError with UNKNOWN type, but since it's an Error,
      // it gets caught and re-wrapped as NETWORK_ERROR in the catch block (line 80)
      expect(result.current.error?.type).toBe("NETWORK_ERROR");
      expect(result.current.error?.message).toContain("Invalid response format");
      expect(result.current.isLoading).toBe(false);
    });
  });

  it("should encode cursor in URL", async () => {
    const cursorWithSpecialChars = "cursor+with/special=chars";
    const dataWithSpecialCursor: FetchResult = {
      ...mockInitialData,
      pageInfo: { hasNextPage: true, endCursor: cursorWithSpecialChars },
    };

    const newData: FetchResult = {
      items: [],
      totalCount: 1,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => newData,
    });

    const { result } = renderHook(() => useIssuesAssigned({ initialData: dataWithSpecialCursor }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        `/api/issues/assigned?cursor=${encodeURIComponent(cursorWithSpecialChars)}`,
        expect.any(Object),
      );
    });
  });

  it("should prevent multiple simultaneous loadMore calls", async () => {
    let callCount = 0;
    const newData: FetchResult = {
      items: [
        {
          id: "2",
          title: "New issue",
          status: "open" as const,
          labels: [],
          repository: { owner: "test", name: "repo" },
          number: 2,
          createdAt: "2024-01-16T10:00:00Z",
          commentCount: 0,
          url: "https://github.com/test/repo/issues/2",
        },
      ],
      totalCount: 2,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    (global.fetch as jest.Mock).mockImplementation(() => {
      callCount++;
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              ok: true,
              json: async () => newData,
            }),
          100,
        ),
      );
    });

    const { result } = renderHook(() => useIssuesAssigned({ initialData: mockInitialData }));

    // Start first request
    act(() => {
      void result.current.loadMore();
    });

    // Try to start second request while first is loading
    act(() => {
      void result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only have made one fetch call because second was prevented
    expect(callCount).toBe(1);
    expect(result.current.items).toHaveLength(2);
  });

  it("should clear error when loadMore is called again", async () => {
    const dataWithNextPage: FetchResult = {
      ...mockInitialData,
      pageInfo: { hasNextPage: true, endCursor: "cursor123" },
    };

    const { result } = renderHook(() => useIssuesAssigned({ initialData: dataWithNextPage }));

    // First call fails
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
    });

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
      expect(result.current.error?.type).toBe("NETWORK_ERROR");
    });

    // Update pageInfo to allow another loadMore call
    const newData: FetchResult = {
      items: [
        {
          id: "2",
          title: "New issue after error",
          status: "open" as const,
          labels: [],
          repository: { owner: "test", name: "repo" },
          number: 2,
          createdAt: "2024-01-16T10:00:00Z",
          commentCount: 0,
          url: "https://github.com/test/repo/issues/2",
        },
      ],
      totalCount: 2,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    // Second call succeeds
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => newData,
    });

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
      expect(result.current.items).toHaveLength(2);
      expect(result.current.items[1].title).toBe("New issue after error");
    });
  });
});
