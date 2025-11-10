import { CardData } from "@/types/card";
import { AppError } from "@/types/errors";

export interface FetchResult {
  items: CardData[];
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    endCursor: string | null;
  };
  error?: AppError;
}

export interface FetchOptions {
  cursor?: string | null;
  first?: number;
}
