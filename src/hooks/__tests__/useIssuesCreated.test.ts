import { renderHook, waitFor, act } from "@testing-library/react";
import { useIssuesCreated } from "../useIssuesCreated";
import { FetchResult } from "@/lib/fetchers/types";
import { CardData } from "@/types/card";

describe("useIssuesCreated", () => {
  const mockInitialData: FetchResult = {
    items: [
      {
        id: "1",
        title: "Test issue 1",
        status: "open",
        labels: [],
        repository: { owner: "test", name: "repo" },
        number: 1,
        createdAt: "2024-01-15T10:00:00Z",
        commentCount: 0,
        url: "https://github.com/test/repo/issues/1",
      },
    ] as CardData[],
    pageInfo: {
      hasNextPage: true,
      endCursor: "cursor123",
    },
  };

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with initial data", () => {
    const { result } = renderHook(() => useIssuesCreated({ initialData: mockInitialData }));

    expect(result.current.items).toEqual(mockInitialData.items);
    expect(result.current.pageInfo).toEqual(mockInitialData.pageInfo);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should load more items successfully", async () => {
    const mockNextPageData: FetchResult = {
      items: [
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
      ] as CardData[],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockNextPageData,
    });

    const { result } = renderHook(() => useIssuesCreated({ initialData: mockInitialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.items[1]).toEqual(mockNextPageData.items[0]);
    expect(result.current.pageInfo).toEqual(mockNextPageData.pageInfo);
    expect(result.current.error).toBeNull();
  });

  it("should handle fetch errors", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
    });

    const { result } = renderHook(() => useIssuesCreated({ initialData: mockInitialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.items).toHaveLength(1); // Original items unchanged
  });

  it("should handle API errors in response", async () => {
    const mockErrorData: FetchResult = {
      items: [],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
      error: {
        type: "RATE_LIMIT",
        message: "Rate limit exceeded",
        retryable: true,
        retryAfter: 3600,
        name: "AppError",
      },
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockErrorData,
    });

    const { result } = renderHook(() => useIssuesCreated({ initialData: mockInitialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(mockErrorData.error);
    expect(result.current.items).toHaveLength(1); // Original items unchanged
  });

  it("should not load more when already loading", async () => {
    (global.fetch as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  items: [],
                  pageInfo: { hasNextPage: false, endCursor: null },
                }),
              }),
            100,
          );
        }),
    );

    const { result } = renderHook(() => useIssuesCreated({ initialData: mockInitialData }));

    // Execute both loads within a single act block to avoid interleaving warnings
    await act(async () => {
      // Start first load (returns a promise we don't await yet)
      const firstLoad = result.current.loadMore();

      // Immediately try second load while first is in progress
      // This should be a no-op due to the loading guard
      await result.current.loadMore();

      // Wait for the first load to complete
      await firstLoad;
    });

    // Only one fetch should be called due to loading guard
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  it("should not load more when hasNextPage is false", async () => {
    const dataWithoutNextPage: FetchResult = {
      items: mockInitialData.items,
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    };

    const { result } = renderHook(() => useIssuesCreated({ initialData: dataWithoutNextPage }));

    await act(async () => {
      await result.current.loadMore();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("should include cursor in API request", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [],
        pageInfo: { hasNextPage: false, endCursor: null },
      }),
    });

    const { result } = renderHook(() => useIssuesCreated({ initialData: mockInitialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/issues/created?cursor=cursor123",
        expect.objectContaining({
          signal: expect.any(Object),
        }),
      );
    });
  });

  it("should clear error on successful load", async () => {
    const mockNextPageData: FetchResult = {
      items: [
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
      ] as CardData[],
      pageInfo: {
        hasNextPage: false,
        endCursor: null,
      },
    };

    // First call fails
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: "Error",
    });

    const { result } = renderHook(() => useIssuesCreated({ initialData: mockInitialData }));

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });

    // Second call succeeds
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockNextPageData,
    });

    await act(async () => {
      await result.current.loadMore();
    });

    await waitFor(() => {
      expect(result.current.error).toBeNull();
    });

    expect(result.current.items).toHaveLength(2);
  });
});
