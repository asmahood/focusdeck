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
