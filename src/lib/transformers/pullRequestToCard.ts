import { CardStatus } from "@/types/card";
import { PullRequestNode, Transformer } from "./types";
import { LabelFieldsFragment, RepositoryFieldsFragment } from "@/graphql/__generated__/graphql";

function mapPullRequestState(state: string, isDraft: boolean): CardStatus {
  if (isDraft) return "draft";
  if (state === "MERGED") return "merged";
  if (state === "OPEN") return "open";
  if (state === "CLOSED") return "closed";
  return "open";
}

export const pullRequestToCard: Transformer<PullRequestNode> = (pr) => {
  // Fragment masking: cast to access the actual fragment data
  const repository = pr.repository as unknown as RepositoryFieldsFragment;

  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    url: pr.url,
    status: mapPullRequestState(pr.state, pr.isDraft),
    repository: {
      owner: repository.owner.login,
      name: repository.name,
    },
    labels: (pr.labels?.nodes ?? [])
      .filter((label): label is NonNullable<typeof label> => label !== null)
      .map((labelRef) => {
        const label = labelRef as unknown as LabelFieldsFragment;
        return {
          name: label.name,
          color: label.color,
        };
      }),
    commentCount: pr.comments.totalCount,
    createdAt: pr.createdAt,
  };
};
