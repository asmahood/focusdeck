import { renderHook, act } from "@testing-library/react";
import { useInfiniteScroll } from "../useInfiniteScroll";

describe("useInfiniteScroll", () => {
  let mockObserve: jest.Mock;
  let mockDisconnect: jest.Mock;
  let mockUnobserve: jest.Mock;

  beforeEach(() => {
    mockObserve = jest.fn();
    mockDisconnect = jest.fn();
    mockUnobserve = jest.fn();

    // Mock IntersectionObserver
    global.IntersectionObserver = jest.fn().mockImplementation((callback) => {
      return {
        observe: mockObserve,
        disconnect: mockDisconnect,
        unobserve: mockUnobserve,
        callback, // Store callback for access in tests
      };
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Helper function to get the IntersectionObserver callback
  const getObserverCallback = (): IntersectionObserverCallback => {
    const mock = (global.IntersectionObserver as jest.Mock).mock.results[0];
    return mock?.value?.callback;
  };

  describe("initialization", () => {
    it("should return a sentinelRef", () => {
      const { result } = renderHook(() =>
        useInfiniteScroll({
          hasNextPage: true,
          isLoading: false,
          onLoadMore: jest.fn(),
        }),
      );

      expect(result.current.sentinelRef).toBeDefined();
      expect(result.current.sentinelRef.current).toBeNull();
    });

    it("should create IntersectionObserver with correct threshold when sentinel is attached", () => {
      const customThreshold = 300;
      renderHook(() => {
        const mockElement = document.createElement("div");
        const hook = useInfiniteScroll({
          hasNextPage: true,
          isLoading: false,
          onLoadMore: jest.fn(),
          threshold: customThreshold,
        });

        // Set ref immediately in the same render
        hook.sentinelRef.current = mockElement;
        return hook;
      });

      // Observer should be created with custom threshold
      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: `${customThreshold}px`,
        }),
      );
    });

    it("should use default threshold of 200px when not specified", () => {
      renderHook(() => {
        const mockElement = document.createElement("div");
        const hook = useInfiniteScroll({
          hasNextPage: true,
          isLoading: false,
          onLoadMore: jest.fn(),
        });

        // Set ref immediately in the same render
        hook.sentinelRef.current = mockElement;
        return hook;
      });

      // Observer should be created with default threshold
      expect(global.IntersectionObserver).toHaveBeenCalledWith(
        expect.any(Function),
        expect.objectContaining({
          rootMargin: "200px",
        }),
      );
    });
  });

  describe("IntersectionObserver behavior", () => {
    it("should call onLoadMore when sentinel intersects with valid conditions", () => {
      const onLoadMore = jest.fn();
      renderHook(() => {
        const mockElement = document.createElement("div");
        const hook = useInfiniteScroll({
          hasNextPage: true,
          isLoading: false,
          onLoadMore,
        });
        hook.sentinelRef.current = mockElement;
        return hook;
      });

      // Get the callback and trigger intersection
      const callback = getObserverCallback();
      act(() => {
        callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      });

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it("should NOT call onLoadMore when isLoading is true", () => {
      const onLoadMore = jest.fn();
      renderHook(() => {
        const mockElement = document.createElement("div");
        const hook = useInfiniteScroll({
          hasNextPage: true,
          isLoading: true,
          onLoadMore,
        });
        hook.sentinelRef.current = mockElement;
        return hook;
      });

      const callback = getObserverCallback();
      act(() => {
        callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      });

      expect(onLoadMore).not.toHaveBeenCalled();
    });

    it("should NOT call onLoadMore when hasNextPage is false", () => {
      const onLoadMore = jest.fn();
      renderHook(() => {
        const mockElement = document.createElement("div");
        const hook = useInfiniteScroll({
          hasNextPage: false,
          isLoading: false,
          onLoadMore,
        });
        hook.sentinelRef.current = mockElement;
        return hook;
      });

      const callback = getObserverCallback();
      act(() => {
        callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      });

      expect(onLoadMore).not.toHaveBeenCalled();
    });

    it("should NOT call onLoadMore when not intersecting", () => {
      const onLoadMore = jest.fn();
      renderHook(() => {
        const mockElement = document.createElement("div");
        const hook = useInfiniteScroll({
          hasNextPage: true,
          isLoading: false,
          onLoadMore,
        });
        hook.sentinelRef.current = mockElement;
        return hook;
      });

      const callback = getObserverCallback();
      act(() => {
        callback([{ isIntersecting: false } as IntersectionObserverEntry], {} as IntersectionObserver);
      });

      expect(onLoadMore).not.toHaveBeenCalled();
    });

    it("should handle async onLoadMore callback", async () => {
      const onLoadMore = jest.fn().mockResolvedValue(undefined);
      renderHook(() => {
        const mockElement = document.createElement("div");
        const hook = useInfiniteScroll({
          hasNextPage: true,
          isLoading: false,
          onLoadMore,
        });
        hook.sentinelRef.current = mockElement;
        return hook;
      });

      const callback = getObserverCallback();
      await act(async () => {
        callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      });

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });
  });

  describe("observer lifecycle", () => {
    it("should observe sentinel element when ref is set", () => {
      const mockElement = document.createElement("div");
      renderHook(() => {
        const hook = useInfiniteScroll({
          hasNextPage: true,
          isLoading: false,
          onLoadMore: jest.fn(),
        });
        hook.sentinelRef.current = mockElement;
        return hook;
      });

      expect(mockObserve).toHaveBeenCalledWith(mockElement);
    });

    it("should disconnect observer on unmount", () => {
      const mockElement = document.createElement("div");
      const { unmount } = renderHook(() => {
        const hook = useInfiniteScroll({
          hasNextPage: true,
          isLoading: false,
          onLoadMore: jest.fn(),
        });
        hook.sentinelRef.current = mockElement;
        return hook;
      });

      unmount();

      expect(mockDisconnect).toHaveBeenCalled();
    });

    it("should not throw when unmounting without sentinel element", () => {
      const { unmount } = renderHook(() =>
        useInfiniteScroll({
          hasNextPage: true,
          isLoading: false,
          onLoadMore: jest.fn(),
        }),
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  describe("callback updates", () => {
    it("should use updated onLoadMore callback without recreating observer", () => {
      const firstCallback = jest.fn();
      const secondCallback = jest.fn();
      const mockElement = document.createElement("div");

      const { rerender } = renderHook(
        ({ onLoadMore }) => {
          const hook = useInfiniteScroll({
            hasNextPage: true,
            isLoading: false,
            onLoadMore,
          });
          hook.sentinelRef.current = mockElement;
          return hook;
        },
        {
          initialProps: { onLoadMore: firstCallback },
        },
      );

      // First intersection with first callback
      const callback = getObserverCallback();
      act(() => {
        callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      });

      expect(firstCallback).toHaveBeenCalledTimes(1);
      expect(secondCallback).not.toHaveBeenCalled();

      // Update callback
      rerender({ onLoadMore: secondCallback });

      // Second intersection with updated callback (same observer callback reference)
      act(() => {
        callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
      });

      expect(firstCallback).toHaveBeenCalledTimes(1); // Still only called once
      expect(secondCallback).toHaveBeenCalledTimes(1); // New callback called
    });

    it("should recreate observer when hasNextPage changes", () => {
      const mockElement = document.createElement("div");

      const { rerender } = renderHook(
        ({ hasNextPage }) => {
          const hook = useInfiniteScroll({
            hasNextPage,
            isLoading: false,
            onLoadMore: jest.fn(),
          });
          hook.sentinelRef.current = mockElement;
          return hook;
        },
        {
          initialProps: { hasNextPage: true },
        },
      );

      expect(global.IntersectionObserver).toHaveBeenCalledTimes(1);

      // Change hasNextPage
      rerender({ hasNextPage: false });

      expect(global.IntersectionObserver).toHaveBeenCalledTimes(2);
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it("should recreate observer when isLoading changes", () => {
      const mockElement = document.createElement("div");

      const { rerender } = renderHook(
        ({ isLoading }) => {
          const hook = useInfiniteScroll({
            hasNextPage: true,
            isLoading,
            onLoadMore: jest.fn(),
          });
          hook.sentinelRef.current = mockElement;
          return hook;
        },
        {
          initialProps: { isLoading: false },
        },
      );

      expect(global.IntersectionObserver).toHaveBeenCalledTimes(1);

      // Change isLoading
      rerender({ isLoading: true });

      expect(global.IntersectionObserver).toHaveBeenCalledTimes(2);
      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});
