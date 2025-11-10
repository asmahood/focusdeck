import { gql } from "./__generated__";

export const LabelFragment = gql(`
  fragment LabelFields on Label {
    id
    name
    color
  }
`);

export const RepositoryFragment = gql(`
  fragment RepositoryFields on Repository {
    id
    name
    owner {
      login
    }
  }
`);

export const IssueFieldsFragment = gql(`
  fragment IssueFields on Issue {
    id
    number
    title
    url
    state
    createdAt
    labels(first: 10) {
      nodes {
        ...LabelFields
      }
    }
    repository {
      ...RepositoryFields
    }
    comments {
      totalCount
    }
  }
`);

export const PullRequestFieldsFragment = gql(`
  fragment PullRequestFields on PullRequest {
    id
    number
    title
    url
    state
    isDraft
    createdAt
    labels(first: 10) {
      nodes {
        ...LabelFields
      }
    }
    repository {
      ...RepositoryFields
    }
    comments {
      totalCount
    }
  }
`);
