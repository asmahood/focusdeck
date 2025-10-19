import { CardData } from "@/types/card";
import { IssueFieldsFragment } from "@/graphql/__generated__/graphql";

export type Transformer<T> = (data: T) => CardData;

export type IssueNode = IssueFieldsFragment;
