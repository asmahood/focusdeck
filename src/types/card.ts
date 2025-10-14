export type CardStatus = "open" | "closed" | "merged" | "draft";

export interface CardLabel {
  name: string;
  color: string;
}

export interface CardData {
  id: string;
  title: string;
  status: CardStatus;
  labels: CardLabel[];
  repository: {
    owner: string;
    name: string;
  };
  number: number;
  createdAt: string;
  commentCount: number;
  url: string;
}
