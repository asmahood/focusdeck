import type { CardData } from "@/types/card";

/**
 * Column types corresponding to dashboard columns
 */
export type ColumnType = "issues-created" | "issues-assigned" | "pull-requests" | "review-requests";

/**
 * GitHub user object from webhook payloads
 */
export interface GitHubWebhookUser {
  id: number;
  login: string;
  avatar_url: string;
  html_url: string;
}

/**
 * GitHub label object from webhook payloads
 */
export interface GitHubWebhookLabel {
  id: number;
  name: string;
  color: string;
  description: string | null;
}

/**
 * GitHub repository object from webhook payloads
 */
export interface GitHubWebhookRepository {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubWebhookUser;
  html_url: string;
  private: boolean;
}

/**
 * GitHub issue object from webhook payloads
 */
export interface GitHubWebhookIssue {
  id: number;
  node_id: string;
  number: number;
  title: string;
  state: "open" | "closed";
  user: GitHubWebhookUser;
  assignees: GitHubWebhookUser[];
  labels: GitHubWebhookLabel[];
  html_url: string;
  comments: number;
  created_at: string;
  updated_at: string;
}

/**
 * GitHub pull request object from webhook payloads
 */
export interface GitHubWebhookPullRequest {
  id: number;
  node_id: string;
  number: number;
  title: string;
  state: "open" | "closed";
  draft: boolean;
  merged: boolean;
  user: GitHubWebhookUser;
  assignees: GitHubWebhookUser[];
  requested_reviewers: GitHubWebhookUser[];
  labels: GitHubWebhookLabel[];
  html_url: string;
  comments: number;
  created_at: string;
  updated_at: string;
}

/**
 * Issue event payload from GitHub webhook
 */
export interface IssueEventPayload {
  action: string;
  issue: GitHubWebhookIssue;
  repository: GitHubWebhookRepository;
  sender: GitHubWebhookUser;
  assignee?: GitHubWebhookUser;
}

/**
 * Pull request event payload from GitHub webhook
 */
export interface PullRequestEventPayload {
  action: string;
  pull_request: GitHubWebhookPullRequest;
  repository: GitHubWebhookRepository;
  sender: GitHubWebhookUser;
  requested_reviewer?: GitHubWebhookUser;
}

/**
 * GitHub App installation object from webhook payloads
 */
export interface GitHubWebhookInstallation {
  id: number;
  account: {
    id: number;
    login: string;
    type: "User" | "Organization";
  };
  app_id: number;
  target_type: "User" | "Organization";
}

/**
 * Installation event payload from GitHub webhook
 */
export interface InstallationEventPayload {
  action: "created" | "deleted" | "suspend" | "unsuspend" | "new_permissions_accepted";
  installation: GitHubWebhookInstallation;
  sender: GitHubWebhookUser;
}

/**
 * Union of supported webhook payloads
 */
export type WebhookPayload = IssueEventPayload | PullRequestEventPayload | InstallationEventPayload;

/**
 * Affected user with column type and card data
 */
export interface AffectedUser {
  githubUserId: string;
  columnType: ColumnType;
  cardData: CardData;
}

/**
 * Parsed webhook event result for issue/PR events
 */
export interface ParsedWebhookEvent {
  eventType: "issues" | "pull_request";
  action: string;
  affectedUsers: AffectedUser[];
  repository: {
    owner: string;
    name: string;
  };
}

/**
 * Parsed installation event result
 */
export interface ParsedInstallationEvent {
  eventType: "installation";
  action: "deleted";
  installationId: number;
}

/**
 * Result of webhook signature validation
 */
export interface SignatureValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Result of webhook processing
 */
export interface WebhookProcessingResult {
  success: boolean;
  eventsProcessed: number;
  affectedUsers: string[];
  error?: string;
}

/**
 * SSE message for new item events
 */
export interface SSENewItemMessage {
  type: "new-item";
  columnType: ColumnType;
  item: CardData;
}

/**
 * SSE message for heartbeat events
 */
export interface SSEHeartbeatMessage {
  type: "heartbeat";
  timestamp: number;
}

/**
 * Union of all SSE message types
 */
export type SSEMessage = SSENewItemMessage | SSEHeartbeatMessage;
