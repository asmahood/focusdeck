import { gql } from "./__generated__";

// Issues Created query with pagination support
export const GET_ISSUES_CREATED = gql(`
  query GetIssuesCreated($cursor: String, $first: Int = 20) {
    viewer {
      issues(
        first: $first
        after: $cursor
        states: OPEN
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            ...IssueFields
          }
        }
      }
    }
  }
`);

// Issues Assigned query using GitHub Search API
export const GET_ISSUES_ASSIGNED = gql(`
  query GetIssuesAssigned($cursor: String, $first: Int = 20) {
    search(
      query: "is:issue is:open assignee:@me"
      type: ISSUE
      first: $first
      after: $cursor
    ) {
      issueCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ... on Issue {
            ...IssueFields
          }
        }
      }
    }
  }
`);

// Pull Requests Created query with pagination support
export const GET_PULL_REQUESTS_CREATED = gql(`
  query GetPullRequestsCreated($cursor: String, $first: Int = 20) {
    viewer {
      pullRequests(
        first: $first
        after: $cursor
        states: OPEN
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        totalCount
        pageInfo {
          hasNextPage
          endCursor
        }
        edges {
          node {
            ...PullRequestFields
          }
        }
      }
    }
  }
`);
