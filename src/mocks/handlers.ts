/**
 * MSW Request Handlers
 *
 * Define mock API handlers for testing. These handlers intercept HTTP requests
 * and return mock responses. Handlers can be REST or GraphQL.
 *
 * @see https://mswjs.io/docs/
 */

import { graphql, http, HttpResponse } from "msw";

/**
 * GitHub GraphQL API mock handlers
 */
export const githubGraphQLHandlers = [
  // Mock viewer query (current user)
  graphql.query("GetViewer", () => {
    return HttpResponse.json({
      data: {
        viewer: {
          login: "testuser",
          name: "Test User",
          avatarUrl: "https://avatars.githubusercontent.com/u/1?v=4",
          email: "test@example.com",
        },
      },
    });
  }),

  // Mock user issues query
  graphql.query("GetUserIssues", () => {
    return HttpResponse.json({
      data: {
        viewer: {
          issues: {
            nodes: [
              {
                id: "issue-1",
                title: "Test Issue 1",
                number: 1,
                state: "OPEN",
                createdAt: "2025-01-01T00:00:00Z",
                repository: {
                  name: "test-repo",
                  owner: {
                    login: "testuser",
                  },
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      },
    });
  }),

  // Mock issues created query (for infinite scroll)
  graphql.query("GetIssuesCreated", ({ variables }) => {
    const { cursor, first = 20 } = variables;

    // Generate mock issues
    const mockIssues = Array.from({ length: first as number }, (_, i) => ({
      id: `issue-${cursor ? "page2-" : ""}${i}`,
      number: i + 1,
      title: `Test Issue ${i + 1}`,
      url: `https://github.com/testuser/test-repo/issues/${i + 1}`,
      state: "OPEN",
      createdAt: new Date(Date.now() - i * 86400000).toISOString(), // Stagger dates
      repository: {
        id: "repo-1",
        name: "test-repo",
        owner: { login: "testuser" },
      },
      labels: {
        nodes: [
          { id: "label-1", name: "bug", color: "d73a4a" },
          { id: "label-2", name: "enhancement", color: "a2eeef" },
        ],
      },
      comments: { totalCount: i % 5 },
    }));

    return HttpResponse.json({
      data: {
        viewer: {
          issues: {
            pageInfo: {
              hasNextPage: cursor === null || cursor === undefined,
              endCursor: cursor === null || cursor === undefined ? "cursor-page2" : null,
            },
            edges: mockIssues.map((issue) => ({ node: issue })),
          },
        },
      },
    });
  }),

  // Mock pull requests query
  graphql.query("GetUserPullRequests", () => {
    return HttpResponse.json({
      data: {
        viewer: {
          pullRequests: {
            nodes: [
              {
                id: "pr-1",
                title: "Test PR 1",
                number: 1,
                state: "OPEN",
                createdAt: "2025-01-01T00:00:00Z",
                repository: {
                  name: "test-repo",
                  owner: {
                    login: "testuser",
                  },
                },
              },
            ],
            pageInfo: {
              hasNextPage: false,
              endCursor: null,
            },
          },
        },
      },
    });
  }),

  // Catch-all for unhandled GraphQL operations
  graphql.operation(({ operationName }) => {
    console.warn(`Unhandled GraphQL operation: ${operationName}`);
    return HttpResponse.json({
      errors: [
        {
          message: `Unhandled GraphQL operation: ${operationName}`,
        },
      ],
    });
  }),
];

/**
 * NextAuth.js REST API mock handlers
 */
export const authHandlers = [
  // Mock OAuth callback
  http.get("/api/auth/callback/github", () => {
    return HttpResponse.json({
      url: "/dashboard",
    });
  }),

  // Mock session endpoint
  http.get("/api/auth/session", () => {
    return HttpResponse.json({
      user: {
        name: "Test User",
        email: "test@example.com",
        image: "https://avatars.githubusercontent.com/u/1?v=4",
      },
      expires: "2025-12-31T23:59:59.999Z",
    });
  }),

  // Mock signin endpoint
  http.post("/api/auth/signin/github", () => {
    return HttpResponse.json({
      url: "/api/auth/callback/github",
    });
  }),
];

/**
 * GitHub REST API mock handlers
 */
export const githubRestHandlers = [
  // Mock user endpoint
  http.get("https://api.github.com/user", () => {
    return HttpResponse.json({
      login: "testuser",
      name: "Test User",
      email: "test@example.com",
      avatar_url: "https://avatars.githubusercontent.com/u/1?v=4",
    });
  }),
];

/**
 * Combined handlers for all APIs
 * Export this as the default handlers for the MSW server
 */
export const handlers = [...githubGraphQLHandlers, ...authHandlers, ...githubRestHandlers];
