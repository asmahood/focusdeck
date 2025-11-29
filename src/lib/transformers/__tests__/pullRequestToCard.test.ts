import { pullRequestToCard } from "../pullRequestToCard";
import { PullRequestNode } from "../types";

describe("pullRequestToCard", () => {
  it("should transform GitHub PR to CardData", () => {
    const mockPR = {
      id: "PR_123",
      number: 42,
      title: "Test PR",
      url: "https://github.com/owner/repo/pull/42",
      state: "OPEN",
      isDraft: false,
      createdAt: "2024-01-15T10:00:00Z",
      repository: {
        id: "R_1",
        name: "repo",
        owner: { login: "owner" },
      },
      labels: {
        nodes: [{ id: "L1", name: "enhancement", color: "a2eeef" }],
      },
      comments: { totalCount: 3 },
    } as PullRequestNode;

    const result = pullRequestToCard(mockPR);

    expect(result).toEqual({
      id: "PR_123",
      number: 42,
      title: "Test PR",
      url: "https://github.com/owner/repo/pull/42",
      status: "open",
      repository: { owner: "owner", name: "repo" },
      labels: [{ name: "enhancement", color: "a2eeef" }],
      commentCount: 3,
      createdAt: "2024-01-15T10:00:00Z",
    });
  });

  it("should handle draft PR state", () => {
    const mockPR = {
      id: "PR_124",
      number: 43,
      title: "Draft PR",
      url: "https://github.com/owner/repo/pull/43",
      state: "OPEN",
      isDraft: true,
      createdAt: "2024-01-15T10:00:00Z",
      repository: {
        id: "R_1",
        name: "repo",
        owner: { login: "owner" },
      },
      labels: { nodes: [] },
      comments: { totalCount: 0 },
    } as PullRequestNode;

    const result = pullRequestToCard(mockPR);
    expect(result.status).toBe("draft");
  });

  it("should handle merged PR state", () => {
    const mockPR = {
      id: "PR_125",
      number: 44,
      title: "Merged PR",
      url: "https://github.com/owner/repo/pull/44",
      state: "MERGED",
      isDraft: false,
      createdAt: "2024-01-15T10:00:00Z",
      repository: {
        id: "R_1",
        name: "repo",
        owner: { login: "owner" },
      },
      labels: { nodes: [] },
      comments: { totalCount: 5 },
    } as PullRequestNode;

    const result = pullRequestToCard(mockPR);
    expect(result.status).toBe("merged");
  });
});
