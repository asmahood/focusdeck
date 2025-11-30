/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET } from "../route";

// Mock dependencies
jest.mock("@/lib/fetchers", () => ({
  fetchReviewRequests: jest.fn(),
}));

jest.mock("@/lib/api", () => ({
  verifyAuthentication: jest.fn(),
  validateCursor: jest.fn(),
  validatePageSize: jest.fn(),
  getStatusCodeForError: jest.fn(),
  getSafeErrorMessage: jest.fn(),
}));

jest.mock("@/lib/logging/logger", () => ({
  createRequestLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));

jest.mock("@/lib/rate-limit/limiter", () => ({
  apiRateLimiter: {
    check: jest.fn(),
  },
}));

jest.mock("@/auth", () => ({
  auth: jest.fn(),
}));

// Import mocked modules
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { fetchReviewRequests } = require("@/lib/fetchers");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { verifyAuthentication, validateCursor, validatePageSize, getStatusCodeForError, getSafeErrorMessage } =
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("@/lib/api");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { apiRateLimiter } = require("@/lib/rate-limit/limiter");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { auth } = require("@/auth");

describe("GET /api/review-requests", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default successful auth
    verifyAuthentication.mockResolvedValue({
      authenticated: true,
    });

    // Default successful rate limit check
    apiRateLimiter.check.mockReturnValue({
      allowed: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 3600000,
    });

    // Default valid cursor
    validateCursor.mockReturnValue({
      valid: true,
    });

    // Default valid page size
    validatePageSize.mockReturnValue({
      valid: true,
      value: 20,
    });

    // Default auth session
    auth.mockResolvedValue({
      user: { id: "user123", email: "test@example.com" },
    });
  });

  it("should return review requests successfully", async () => {
    const mockData = {
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

    fetchReviewRequests.mockResolvedValue(mockData);

    const request = new NextRequest("http://localhost:3000/api/review-requests");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual(mockData);
  });

  it("should handle pagination with cursor parameter", async () => {
    const mockData = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    fetchReviewRequests.mockResolvedValue(mockData);

    const request = new NextRequest("http://localhost:3000/api/review-requests?cursor=cursor123");
    await GET(request);

    expect(validateCursor).toHaveBeenCalledWith("cursor123");
    expect(fetchReviewRequests).toHaveBeenCalledWith({
      cursor: "cursor123",
      first: 20,
    });
  });

  it("should handle custom page size parameter", async () => {
    validatePageSize.mockReturnValue({
      valid: true,
      value: 50,
    });

    const mockData = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    fetchReviewRequests.mockResolvedValue(mockData);

    const request = new NextRequest("http://localhost:3000/api/review-requests?first=50");
    await GET(request);

    expect(validatePageSize).toHaveBeenCalledWith("50");
    expect(fetchReviewRequests).toHaveBeenCalledWith({
      cursor: null,
      first: 50,
    });
  });

  it("should return 401 when authentication fails", async () => {
    verifyAuthentication.mockResolvedValue({
      authenticated: false,
      errorResponse: new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
    });

    const request = new NextRequest("http://localhost:3000/api/review-requests");
    const response = await GET(request);

    expect(response.status).toBe(401);
    expect(fetchReviewRequests).not.toHaveBeenCalled();
  });

  it("should return 429 when rate limit is exceeded", async () => {
    apiRateLimiter.check.mockReturnValue({
      allowed: false,
      limit: 100,
      remaining: 0,
      reset: Date.now() + 3600000,
      retryAfter: 3600,
    });

    const request = new NextRequest("http://localhost:3000/api/review-requests");
    const response = await GET(request);

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error.type).toBe("RATE_LIMIT");
    expect(response.headers.get("Retry-After")).toBe("3600");
  });

  it("should return 400 for invalid cursor", async () => {
    validateCursor.mockReturnValue({
      valid: false,
      error: "Invalid cursor format",
    });

    const request = new NextRequest("http://localhost:3000/api/review-requests?cursor=invalid");
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.message).toBe("Invalid cursor format");
  });

  it("should return 400 for invalid page size", async () => {
    validatePageSize.mockReturnValue({
      valid: false,
      error: "Invalid page size",
    });

    const request = new NextRequest("http://localhost:3000/api/review-requests?first=invalid");
    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error.message).toBe("Invalid page size");
  });

  it("should handle fetch errors and return appropriate status code", async () => {
    const mockError = {
      type: "NETWORK_ERROR",
      message: "Network request failed",
      retryable: true,
    };

    fetchReviewRequests.mockRejectedValue(mockError);
    getStatusCodeForError.mockReturnValue(503);
    getSafeErrorMessage.mockReturnValue("Service temporarily unavailable");

    const request = new NextRequest("http://localhost:3000/api/review-requests");
    const response = await GET(request);

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error.type).toBe("NETWORK_ERROR");
  });

  it("should handle rate limit errors from fetcher", async () => {
    const mockError = {
      type: "RATE_LIMIT",
      message: "Rate limit exceeded",
      retryable: true,
      retryAfter: 3600,
    };

    fetchReviewRequests.mockRejectedValue(mockError);
    getStatusCodeForError.mockReturnValue(429);
    getSafeErrorMessage.mockReturnValue("Too many requests");

    const request = new NextRequest("http://localhost:3000/api/review-requests");
    const response = await GET(request);

    expect(response.status).toBe(429);
    const data = await response.json();
    expect(data.error.type).toBe("RATE_LIMIT");
    expect(data.error.retryAfter).toBe(3600);
    expect(response.headers.get("Retry-After")).toBe("3600");
  });

  it("should return 500 for unknown errors", async () => {
    fetchReviewRequests.mockRejectedValue(new Error("Unknown error"));

    const request = new NextRequest("http://localhost:3000/api/review-requests");
    const response = await GET(request);

    expect(response.status).toBe(500);
    const data = await response.json();
    expect(data.error.type).toBe("UNKNOWN");
    expect(data.error.message).toBe("An unexpected error occurred");
  });

  it("should include request ID in response headers", async () => {
    const mockData = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    fetchReviewRequests.mockResolvedValue(mockData);

    const request = new NextRequest("http://localhost:3000/api/review-requests");
    const response = await GET(request);

    expect(response.headers.get("X-Request-Id")).toBeTruthy();
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("99");
  });

  it("should use user ID from session for rate limiting", async () => {
    auth.mockResolvedValue({
      user: { id: "user456", email: "another@example.com" },
    });

    const mockData = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    fetchReviewRequests.mockResolvedValue(mockData);

    const request = new NextRequest("http://localhost:3000/api/review-requests");
    await GET(request);

    expect(apiRateLimiter.check).toHaveBeenCalledWith("user456");
  });

  it("should use email as fallback for rate limiting when no user ID", async () => {
    auth.mockResolvedValue({
      user: { email: "test@example.com" },
    });

    const mockData = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    fetchReviewRequests.mockResolvedValue(mockData);

    const request = new NextRequest("http://localhost:3000/api/review-requests");
    await GET(request);

    expect(apiRateLimiter.check).toHaveBeenCalledWith("test@example.com");
  });

  it("should use 'anonymous' for rate limiting when no session", async () => {
    auth.mockResolvedValue(null);

    const mockData = {
      items: [],
      totalCount: 0,
      pageInfo: { hasNextPage: false, endCursor: null },
    };

    fetchReviewRequests.mockResolvedValue(mockData);

    const request = new NextRequest("http://localhost:3000/api/review-requests");
    await GET(request);

    expect(apiRateLimiter.check).toHaveBeenCalledWith("anonymous");
  });
});
