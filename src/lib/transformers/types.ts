import { CardData } from "@/types/card";
import { IssueFieldsFragment, PullRequestFieldsFragment } from "@/graphql/__generated__/graphql";

export type Transformer<T> = (data: T) => CardData;

export type IssueNode = IssueFieldsFragment;
export type PullRequestNode = PullRequestFieldsFragment;
