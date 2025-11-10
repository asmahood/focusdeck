import { CardStatus } from "@/types/card";
import { IssueNode, Transformer } from "./types";
import { LabelFieldsFragment, RepositoryFieldsFragment } from "@/graphql/__generated__/graphql";

function mapIssueState(state: string): CardStatus {
  if (state === "OPEN") return "open";
  if (state === "CLOSED") return "closed";
  return "open";
}

export const issueToCard: Transformer<IssueNode> = (issue) => {
  // Fragment masking: cast to access the actual fragment data
  const repository = issue.repository as unknown as RepositoryFieldsFragment;

  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    url: issue.url,
    status: mapIssueState(issue.state),
    repository: {
      owner: repository.owner.login,
      name: repository.name,
    },
    labels: (issue.labels?.nodes ?? [])
      .filter((label): label is NonNullable<typeof label> => label !== null)
      .map((labelRef) => {
        const label = labelRef as unknown as LabelFieldsFragment;
        return {
          name: label.name,
          color: label.color,
        };
      }),
    commentCount: issue.comments.totalCount,
    createdAt: issue.createdAt,
  };
};
