import { CardData } from "@/types/card";

export const mockIssuesCreated: CardData[] = [
  {
    id: "1",
    title: "Add dark mode support to the dashboard",
    status: "open",
    labels: [
      { name: "enhancement", color: "#a2eeef" },
      { name: "good first issue", color: "#7057ff" },
      { name: "ui", color: "#0075ca" },
    ],
    repository: {
      owner: "focusdeck",
      name: "web-app",
    },
    number: 42,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    commentCount: 5,
    url: "https://github.com/focusdeck/web-app/issues/42",
  },
  {
    id: "2",
    title: "Performance optimization for large datasets in card rendering",
    status: "open",
    labels: [
      { name: "performance", color: "#d73a4a" },
      { name: "priority: high", color: "#e99695" },
    ],
    repository: {
      owner: "focusdeck",
      name: "web-app",
    },
    number: 38,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    commentCount: 12,
    url: "https://github.com/focusdeck/web-app/issues/38",
  },
  {
    id: "3",
    title: "Documentation update for authentication flow",
    status: "closed",
    labels: [
      { name: "documentation", color: "#0075ca" },
      { name: "completed", color: "#8b5cf6" },
    ],
    repository: {
      owner: "focusdeck",
      name: "docs",
    },
    number: 15,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    commentCount: 3,
    url: "https://github.com/focusdeck/docs/issues/15",
  },
  {
    id: "4",
    title: "Implement keyboard shortcuts for navigation",
    status: "open",
    labels: [
      { name: "enhancement", color: "#a2eeef" },
      { name: "accessibility", color: "#0e8a16" },
      { name: "ux", color: "#c5def5" },
      { name: "help wanted", color: "#008672" },
    ],
    repository: {
      owner: "focusdeck",
      name: "web-app",
    },
    number: 51,
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    commentCount: 8,
    url: "https://github.com/focusdeck/web-app/issues/51",
  },
];

export const mockIssuesAssigned: CardData[] = [
  {
    id: "5",
    title: "Fix responsive layout issues on mobile devices",
    status: "open",
    labels: [
      { name: "bug", color: "#d73a4a" },
      { name: "mobile", color: "#fbca04" },
      { name: "css", color: "#fef2c0" },
    ],
    repository: {
      owner: "focusdeck",
      name: "web-app",
    },
    number: 47,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    commentCount: 7,
    url: "https://github.com/focusdeck/web-app/issues/47",
  },
  {
    id: "6",
    title: "Refactor authentication middleware for better error handling",
    status: "open",
    labels: [
      { name: "refactor", color: "#1d76db" },
      { name: "security", color: "#d93f0b" },
    ],
    repository: {
      owner: "focusdeck",
      name: "backend",
    },
    number: 23,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    commentCount: 15,
    url: "https://github.com/focusdeck/backend/issues/23",
  },
  {
    id: "7",
    title: "Add unit tests for card component",
    status: "open",
    labels: [{ name: "testing", color: "#bfd4f2" }],
    repository: {
      owner: "focusdeck",
      name: "web-app",
    },
    number: 44,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    commentCount: 2,
    url: "https://github.com/focusdeck/web-app/issues/44",
  },
];

export const mockPullRequests: CardData[] = [
  {
    id: "8",
    title: "feat: Add GraphQL integration for issue fetching",
    status: "open",
    labels: [
      { name: "feature", color: "#a2eeef" },
      { name: "backend", color: "#1d76db" },
    ],
    repository: {
      owner: "focusdeck",
      name: "api",
    },
    number: 89,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    commentCount: 9,
    url: "https://github.com/focusdeck/api/pull/89",
  },
  {
    id: "9",
    title: "fix: Resolve memory leak in card rendering component",
    status: "open",
    labels: [
      { name: "bug", color: "#d73a4a" },
      { name: "priority: critical", color: "#b60205" },
      { name: "performance", color: "#d73a4a" },
    ],
    repository: {
      owner: "focusdeck",
      name: "web-app",
    },
    number: 92,
    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    commentCount: 18,
    url: "https://github.com/focusdeck/web-app/pull/92",
  },
  {
    id: "10",
    title: "chore: Update dependencies to latest versions",
    status: "merged",
    labels: [
      { name: "dependencies", color: "#0366d6" },
      { name: "maintenance", color: "#fbca04" },
    ],
    repository: {
      owner: "focusdeck",
      name: "web-app",
    },
    number: 88,
    createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    commentCount: 4,
    url: "https://github.com/focusdeck/web-app/pull/88",
  },
  {
    id: "11",
    title: "docs: Improve API documentation with examples",
    status: "draft",
    labels: [
      { name: "documentation", color: "#0075ca" },
      { name: "work in progress", color: "#f9d0c4" },
    ],
    repository: {
      owner: "focusdeck",
      name: "api",
    },
    number: 91,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    commentCount: 1,
    url: "https://github.com/focusdeck/api/pull/91",
  },
  {
    id: "12",
    title: "feat: Implement real-time notifications using WebSocket",
    status: "open",
    labels: [
      { name: "feature", color: "#a2eeef" },
      { name: "websocket", color: "#5319e7" },
      { name: "real-time", color: "#1d76db" },
    ],
    repository: {
      owner: "focusdeck",
      name: "backend",
    },
    number: 67,
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
    commentCount: 22,
    url: "https://github.com/focusdeck/backend/pull/67",
  },
];

export const mockReviewRequests: CardData[] = [
  {
    id: "13",
    title: "refactor: Migrate to TypeScript for better type safety",
    status: "open",
    labels: [
      { name: "refactor", color: "#1d76db" },
      { name: "typescript", color: "#3178c6" },
      { name: "priority: medium", color: "#fef2c0" },
    ],
    repository: {
      owner: "opensource",
      name: "example-project",
    },
    number: 156,
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
    commentCount: 11,
    url: "https://github.com/opensource/example-project/pull/156",
  },
  {
    id: "14",
    title: "feat: Add export functionality for dashboard data",
    status: "open",
    labels: [
      { name: "feature", color: "#a2eeef" },
      { name: "enhancement", color: "#a2eeef" },
    ],
    repository: {
      owner: "focusdeck",
      name: "web-app",
    },
    number: 95,
    createdAt: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
    commentCount: 6,
    url: "https://github.com/focusdeck/web-app/pull/95",
  },
  {
    id: "15",
    title: "fix: Correct date formatting in card metadata",
    status: "open",
    labels: [{ name: "bug", color: "#d73a4a" }],
    repository: {
      owner: "focusdeck",
      name: "web-app",
    },
    number: 93,
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
    commentCount: 3,
    url: "https://github.com/focusdeck/web-app/pull/93",
  },
  {
    id: "16",
    title: "perf: Optimize GraphQL query performance for large result sets",
    status: "open",
    labels: [
      { name: "performance", color: "#d73a4a" },
      { name: "graphql", color: "#e10098" },
      { name: "optimization", color: "#c5def5" },
    ],
    repository: {
      owner: "focusdeck",
      name: "api",
    },
    number: 102,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    commentCount: 27,
    url: "https://github.com/focusdeck/api/pull/102",
  },
];
