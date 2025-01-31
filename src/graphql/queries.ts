import { gql } from "./__generated__";

export const getCreatedIssuesQuery = gql(`
  query GetCreatedIssues {
    viewer {
      issues(first: 20, states: OPEN, orderBy: { field: CREATED_AT, direction: DESC }) {
        edges {
          node {
            title
            repository {
              name
            }
          }
        }
      }
    }
  }
`);
