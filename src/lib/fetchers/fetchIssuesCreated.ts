import { client } from "@/graphql/client";
import { GET_ISSUES_CREATED } from "@/graphql/queries";
import { issueToCard, IssueNode } from "@/lib/transformers";
import { FetchResult, FetchOptions } from "./types";
import { createAppError } from "@/types/errors";
import { handleGraphQLError } from "./errorHandler";

export async function fetchIssuesCreated(options: FetchOptions = {}): Promise<FetchResult> {
  const { cursor = null, first = 20 } = options;

  try {
    const { data, errors } = await client.query({
      query: GET_ISSUES_CREATED,
      variables: { cursor, first },
      fetchPolicy: "network-only", // Always fetch fresh data
    });

    if (errors) {
      throw createAppError("GRAPHQL_ERROR", `GraphQL errors: ${errors.map((e) => e.message).join(", ")}`, true);
    }

    const edges = data.viewer.issues.edges ?? [];
    const items = edges
      .map((edge) => edge?.node)
      .filter((node): node is NonNullable<typeof node> => node !== null)
      .map((node) => issueToCard(node as IssueNode));

    return {
      items,
      totalCount: data.viewer.issues.totalCount,
      pageInfo: {
        hasNextPage: data.viewer.issues.pageInfo.hasNextPage,
        endCursor: data.viewer.issues.pageInfo.endCursor ?? null,
      },
    };
  } catch (error) {
    // Use shared error handling logic
    handleGraphQLError(error);
  }
}
