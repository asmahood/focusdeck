import { gql } from "./__generated__";

// Issues Created query using GitHub Search API
export const GET_ISSUES_CREATED = gql(`
  query GetIssuesCreated($cursor: String, $first: Int = 20) {
    search(
      query: "is:issue is:open author:@me archived:false sort:created-desc"
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

// Issues Assigned query using GitHub Search API
export const GET_ISSUES_ASSIGNED = gql(`
  query GetIssuesAssigned($cursor: String, $first: Int = 20) {
    search(
      query: "is:issue is:open assignee:@me archived:false"
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

// Pull Requests Created query using GitHub Search API
export const GET_PULL_REQUESTS_CREATED = gql(`
  query GetPullRequestsCreated($cursor: String, $first: Int = 20) {
    search(
      query: "is:pr is:open author:@me archived:false sort:created-desc"
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
          ... on PullRequest {
            ...PullRequestFields
          }
        }
      }
    }
  }
`);

// Review Requests query using GitHub Search API
export const GET_REVIEW_REQUESTS = gql(`
  query GetReviewRequests($cursor: String, $first: Int = 20) {
    search(
      query: "is:pr is:open review-requested:@me archived:false"
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
          ... on PullRequest {
            ...PullRequestFields
          }
        }
      }
    }
  }
`);
