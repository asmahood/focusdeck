import { fetchReviewRequests } from "../fetchReviewRequests";

// Mock the GraphQL client module
jest.mock("@/graphql/client", () => ({
  client: {
    query: jest.fn(),
  },
}));

// Import after mocking
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { client } = require("@/graphql/client");
const mockClient = client as jest.Mocked<typeof client>;

describe("fetchReviewRequests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and transform review requests successfully", async () => {
    const mockData = {
      search: {
        issueCount: 2,
        pageInfo: {
          hasNextPage: true,
          endCursor: "cursor123",
        },
        edges: [
          {
            node: {
              id: "PR_123",
              number: 42,
              title: "First review request",
              url: "https://github.com/owner/repo/pull/42",
              state: "OPEN",
              isDraft: false,
              createdAt: "2024-01-15T10:00:00Z",
              repository: {
                id: "R_1",
                name: "repo",
                owner: { login: "owner" },
              },
              labels: { nodes: [] },
              comments: { totalCount: 0 },
            },
          },
          {
            node: {
              id: "PR_456",
              number: 43,
              title: "Second review request",
              url: "https://github.com/owner/repo/pull/43",
              state: "OPEN",
              isDraft: true,
              createdAt: "2024-01-16T10:00:00Z",
              repository: {
                id: "R_1",
                name: "repo",
                owner: { login: "owner" },
              },
              labels: { nodes: [] },
              comments: { totalCount: 2 },
            },
          },
        ],
      },
    };

    mockClient.query.mockResolvedValue({
      data: mockData,
      errors: undefined,
      loading: false,
      networkStatus: 7,
    });

    const result = await fetchReviewRequests({ first: 20 });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe("First review request");
    expect(result.items[1].title).toBe("Second review request");
    expect(result.totalCount).toBe(2);
    expect(result.pageInfo.hasNextPage).toBe(true);
    expect(result.pageInfo.endCursor).toBe("cursor123");
  });

  it("should handle pagination with cursor", async () => {
    const mockData = {
      search: {
        issueCount: 5,
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
        edges: [
          {
            node: {
              id: "PR_789",
              number: 44,
              title: "Paginated review request",
              url: "https://github.com/owner/repo/pull/44",
              state: "OPEN",
              isDraft: false,
              createdAt: "2024-01-17T10:00:00Z",
              repository: {
                id: "R_1",
                name: "repo",
                owner: { login: "owner" },
              },
              labels: { nodes: [] },
              comments: { totalCount: 1 },
            },
          },
        ],
      },
    };

    mockClient.query.mockResolvedValue({
      data: mockData,
      errors: undefined,
      loading: false,
      networkStatus: 7,
    });

    const result = await fetchReviewRequests({ cursor: "cursor123", first: 20 });

    expect(mockClient.query).toHaveBeenCalledWith({
      query: expect.anything(),
      variables: { cursor: "cursor123", first: 20 },
      fetchPolicy: "network-only",
    });
    expect(result.items).toHaveLength(1);
    expect(result.pageInfo.hasNextPage).toBe(false);
    expect(result.pageInfo.endCursor).toBeNull();
  });

  it("should handle empty results", async () => {
    const mockData = {
      search: {
        issueCount: 0,
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
        edges: [],
      },
    };

    mockClient.query.mockResolvedValue({
      data: mockData,
      errors: undefined,
      loading: false,
      networkStatus: 7,
    });

    const result = await fetchReviewRequests({ first: 20 });

    expect(result.items).toHaveLength(0);
    expect(result.totalCount).toBe(0);
    expect(result.pageInfo.hasNextPage).toBe(false);
  });

  it("should throw GRAPHQL_ERROR when GraphQL errors are present", async () => {
    mockClient.query.mockResolvedValue({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {} as any,
      errors: [{ message: "GraphQL error occurred" }],
      loading: false,
      networkStatus: 7,
    });

    await expect(fetchReviewRequests({ first: 20 })).rejects.toMatchObject({
      type: "GRAPHQL_ERROR",
      message: expect.stringContaining("GraphQL errors"),
      retryable: true,
    });
  });

  it("should throw AUTH_ERROR for unauthorized requests", async () => {
    mockClient.query.mockRejectedValue(new Error("401 Unauthorized"));

    await expect(fetchReviewRequests({ first: 20 })).rejects.toMatchObject({
      type: "AUTH_ERROR",
      message: "Authentication failed",
      retryable: false,
    });
  });

  it("should throw RATE_LIMIT error when rate limited", async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rateLimitError = new Error("API rate limit exceeded") as any;
    rateLimitError.graphQLErrors = [
      {
        type: "RATE_LIMITED",
        message: "API rate limit exceeded",
      },
    ];

    mockClient.query.mockRejectedValue(rateLimitError);

    await expect(fetchReviewRequests({ first: 20 })).rejects.toMatchObject({
      type: "RATE_LIMIT",
      message: "Rate limit exceeded",
      retryable: true,
      retryAfter: 3600,
    });
  });

  it("should throw NETWORK_ERROR for network failures", async () => {
    mockClient.query.mockRejectedValue(new Error("fetch failed"));

    await expect(fetchReviewRequests({ first: 20 })).rejects.toMatchObject({
      type: "NETWORK_ERROR",
      message: "Network request failed",
      retryable: true,
    });
  });

  it("should handle null nodes in edges", async () => {
    const mockData = {
      search: {
        issueCount: 1,
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
        edges: [
          {
            node: null,
          },
          {
            node: {
              id: "PR_999",
              number: 99,
              title: "Valid review request",
              url: "https://github.com/owner/repo/pull/99",
              state: "OPEN",
              isDraft: false,
              createdAt: "2024-01-18T10:00:00Z",
              repository: {
                id: "R_1",
                name: "repo",
                owner: { login: "owner" },
              },
              labels: { nodes: [] },
              comments: { totalCount: 0 },
            },
          },
        ],
      },
    };

    mockClient.query.mockResolvedValue({
      data: mockData,
      errors: undefined,
      loading: false,
      networkStatus: 7,
    });

    const result = await fetchReviewRequests({ first: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Valid review request");
  });

  it("should use default options when none provided", async () => {
    const mockData = {
      search: {
        issueCount: 0,
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
        edges: [],
      },
    };

    mockClient.query.mockResolvedValue({
      data: mockData,
      errors: undefined,
      loading: false,
      networkStatus: 7,
    });

    await fetchReviewRequests();

    expect(mockClient.query).toHaveBeenCalledWith({
      query: expect.anything(),
      variables: { cursor: null, first: 20 },
      fetchPolicy: "network-only",
    });
  });

  it("should correctly transform draft PRs", async () => {
    const mockData = {
      search: {
        issueCount: 1,
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
        edges: [
          {
            node: {
              id: "PR_DRAFT",
              number: 100,
              title: "Draft PR awaiting review",
              url: "https://github.com/owner/repo/pull/100",
              state: "OPEN",
              isDraft: true,
              createdAt: "2024-01-19T10:00:00Z",
              repository: {
                id: "R_1",
                name: "repo",
                owner: { login: "owner" },
              },
              labels: { nodes: [] },
              comments: { totalCount: 0 },
            },
          },
        ],
      },
    };

    mockClient.query.mockResolvedValue({
      data: mockData,
      errors: undefined,
      loading: false,
      networkStatus: 7,
    });

    const result = await fetchReviewRequests({ first: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe("draft");
  });
});
