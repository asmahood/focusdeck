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
