import { fetchIssuesAssigned } from "../fetchIssuesAssigned";

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

describe("fetchIssuesAssigned", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch and transform assigned issues successfully", async () => {
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
              id: "I_123",
              number: 42,
              title: "First assigned issue",
              url: "https://github.com/owner/repo/issues/42",
              state: "OPEN",
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
              id: "I_456",
              number: 43,
              title: "Second assigned issue",
              url: "https://github.com/owner/repo/issues/43",
              state: "OPEN",
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

    const result = await fetchIssuesAssigned({ first: 20 });

    expect(result.items).toHaveLength(2);
    expect(result.items[0].title).toBe("First assigned issue");
    expect(result.items[1].title).toBe("Second assigned issue");
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
              id: "I_789",
              number: 44,
              title: "Paginated issue",
              url: "https://github.com/owner/repo/issues/44",
              state: "OPEN",
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

    const result = await fetchIssuesAssigned({ cursor: "cursor123", first: 20 });

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

    const result = await fetchIssuesAssigned({ first: 20 });

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

    await expect(fetchIssuesAssigned({ first: 20 })).rejects.toMatchObject({
      type: "GRAPHQL_ERROR",
      message: expect.stringContaining("GraphQL errors"),
      retryable: true,
    });
  });

  it("should throw AUTH_ERROR for unauthorized requests", async () => {
    mockClient.query.mockRejectedValue(new Error("401 Unauthorized"));

    await expect(fetchIssuesAssigned({ first: 20 })).rejects.toMatchObject({
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

    await expect(fetchIssuesAssigned({ first: 20 })).rejects.toMatchObject({
      type: "RATE_LIMIT",
      message: "Rate limit exceeded",
      retryable: true,
      retryAfter: 3600,
    });
  });

  it("should throw NETWORK_ERROR for network failures", async () => {
    mockClient.query.mockRejectedValue(new Error("fetch failed"));

    await expect(fetchIssuesAssigned({ first: 20 })).rejects.toMatchObject({
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
              id: "I_999",
              number: 99,
              title: "Valid issue",
              url: "https://github.com/owner/repo/issues/99",
              state: "OPEN",
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

    const result = await fetchIssuesAssigned({ first: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].title).toBe("Valid issue");
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

    await fetchIssuesAssigned();

    expect(mockClient.query).toHaveBeenCalledWith({
      query: expect.anything(),
      variables: { cursor: null, first: 20 },
      fetchPolicy: "network-only",
    });
  });
});
