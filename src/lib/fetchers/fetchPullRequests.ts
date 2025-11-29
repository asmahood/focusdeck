import { client } from "@/graphql/client";
import { GET_PULL_REQUESTS_CREATED } from "@/graphql/queries";
import { pullRequestToCard, PullRequestNode } from "@/lib/transformers";
import { FetchResult, FetchOptions } from "./types";
import { createAppError } from "@/types/errors";
import { handleGraphQLError } from "./errorHandler";

export async function fetchPullRequests(options: FetchOptions = {}): Promise<FetchResult> {
  const { cursor = null, first = 20 } = options;

  try {
    const { data, errors } = await client.query({
      query: GET_PULL_REQUESTS_CREATED,
      variables: { cursor, first },
      fetchPolicy: "network-only",
    });

    if (errors) {
      throw createAppError("GRAPHQL_ERROR", `GraphQL errors: ${errors.map((e) => e.message).join(", ")}`, true);
    }

    const edges = data.viewer.pullRequests.edges ?? [];
    const items = edges
      .map((edge) => edge?.node)
      .filter((node): node is NonNullable<typeof node> => node !== null)
      .map((node) => pullRequestToCard(node as PullRequestNode));

    return {
      items,
      totalCount: data.viewer.pullRequests.totalCount,
      pageInfo: {
        hasNextPage: data.viewer.pullRequests.pageInfo.hasNextPage,
        endCursor: data.viewer.pullRequests.pageInfo.endCursor ?? null,
      },
    };
  } catch (error) {
    // Use shared error handling logic
    handleGraphQLError(error);
  }
}
