import { issueToCard } from "../issueToCard";
import { IssueNode } from "../types";

describe("issueToCard", () => {
  it("should transform GitHub issue to CardData", () => {
    const mockIssue = {
      id: "I_123",
      number: 42,
      title: "Test issue",
      url: "https://github.com/owner/repo/issues/42",
      state: "OPEN",
      createdAt: "2024-01-15T10:00:00Z",
      repository: {
        id: "R_1",
        name: "repo",
        owner: { login: "owner" },
      },
      labels: {
        nodes: [{ id: "L1", name: "bug", color: "d73a4a" }],
      },
      comments: { totalCount: 5 },
    } as IssueNode;

    const result = issueToCard(mockIssue);

    expect(result).toEqual({
      id: "I_123",
      number: 42,
      title: "Test issue",
      url: "https://github.com/owner/repo/issues/42",
      status: "open",
      repository: { owner: "owner", name: "repo" },
      labels: [{ name: "bug", color: "d73a4a" }],
      commentCount: 5,
      createdAt: "2024-01-15T10:00:00Z",
    });
  });

  it("should handle CLOSED state", () => {
    const mockIssue = {
      id: "I_124",
      number: 43,
      title: "Closed issue",
      url: "https://github.com/owner/repo/issues/43",
      state: "CLOSED",
      createdAt: "2024-01-15T10:00:00Z",
      repository: {
        id: "R_1",
        name: "repo",
        owner: { login: "owner" },
      },
      labels: { nodes: [] },
      comments: { totalCount: 0 },
    } as IssueNode;

    const result = issueToCard(mockIssue);
    expect(result.status).toBe("closed");
  });

  it("should filter out null labels", () => {
    const mockIssue = {
      id: "I_125",
      number: 44,
      title: "Issue with null labels",
      url: "https://github.com/owner/repo/issues/44",
      state: "OPEN",
      createdAt: "2024-01-15T10:00:00Z",
      repository: {
        id: "R_1",
        name: "repo",
        owner: { login: "owner" },
      },
      labels: {
        nodes: [{ id: "L1", name: "bug", color: "d73a4a" }, null, { id: "L2", name: "feature", color: "a2eeef" }],
      },
      comments: { totalCount: 0 },
    } as IssueNode;

    const result = issueToCard(mockIssue);
    expect(result.labels).toHaveLength(2);
    expect(result.labels).toEqual([
      { name: "bug", color: "d73a4a" },
      { name: "feature", color: "a2eeef" },
    ]);
  });

  it("should handle empty labels array", () => {
    const mockIssue = {
      id: "I_126",
      number: 45,
      title: "Issue with no labels",
      url: "https://github.com/owner/repo/issues/45",
      state: "OPEN",
      createdAt: "2024-01-15T10:00:00Z",
      repository: {
        id: "R_1",
        name: "repo",
        owner: { login: "owner" },
      },
      labels: { nodes: [] },
      comments: { totalCount: 0 },
    } as IssueNode;

    const result = issueToCard(mockIssue);
    expect(result.labels).toEqual([]);
  });

  it("should handle null labels nodes", () => {
    const mockIssue = {
      id: "I_127",
      number: 46,
      title: "Issue with null labels nodes",
      url: "https://github.com/owner/repo/issues/46",
      state: "OPEN",
      createdAt: "2024-01-15T10:00:00Z",
      repository: {
        id: "R_1",
        name: "repo",
        owner: { login: "owner" },
      },
      labels: { nodes: null },
      comments: { totalCount: 0 },
    } as unknown as IssueNode;

    const result = issueToCard(mockIssue);
    expect(result.labels).toEqual([]);
  });

  it("should preserve all issue metadata", () => {
    const mockIssue = {
      id: "I_128",
      number: 100,
      title: "Feature request: Add dark mode",
      url: "https://github.com/myorg/myrepo/issues/100",
      state: "OPEN",
      createdAt: "2025-01-15T14:30:00Z",
      repository: {
        id: "R_999",
        name: "myrepo",
        owner: { login: "myorg" },
      },
      labels: {
        nodes: [
          { id: "L1", name: "enhancement", color: "84b6eb" },
          { id: "L2", name: "ui", color: "bfdadc" },
        ],
      },
      comments: { totalCount: 12 },
    } as IssueNode;

    const result = issueToCard(mockIssue);

    expect(result.id).toBe("I_128");
    expect(result.number).toBe(100);
    expect(result.title).toBe("Feature request: Add dark mode");
    expect(result.url).toBe("https://github.com/myorg/myrepo/issues/100");
    expect(result.createdAt).toBe("2025-01-15T14:30:00Z");
    expect(result.commentCount).toBe(12);
    expect(result.repository).toEqual({
      owner: "myorg",
      name: "myrepo",
    });
  });

  it("should default to open status for unknown states", () => {
    const mockIssue = {
      id: "I_129",
      number: 47,
      title: "Issue with unknown state",
      url: "https://github.com/owner/repo/issues/47",
      state: "UNKNOWN_STATE",
      createdAt: "2024-01-15T10:00:00Z",
      repository: {
        id: "R_1",
        name: "repo",
        owner: { login: "owner" },
      },
      labels: { nodes: [] },
      comments: { totalCount: 0 },
    } as IssueNode;

    const result = issueToCard(mockIssue);
    expect(result.status).toBe("open");
  });
});
