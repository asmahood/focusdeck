import type { CardData, CardStatus, CardLabel } from "@/types/card";
import type {
  ParsedWebhookEvent,
  AffectedUser,
  WebhookPayload,
  IssueEventPayload,
  PullRequestEventPayload,
  GitHubWebhookIssue,
  GitHubWebhookPullRequest,
  GitHubWebhookRepository,
} from "./types";

/**
 * Supported events mapping: eventType -> supported actions
 */
const SUPPORTED_EVENTS: Record<string, string[]> = {
  issues: ["opened", "assigned"],
  pull_request: ["opened", "review_requested"],
};

/**
 * Detect event type from X-GitHub-Event header
 */
export function getEventType(eventHeader: string | null): "issues" | "pull_request" | null {
  if (eventHeader === "issues" || eventHeader === "pull_request") {
    return eventHeader;
  }
  return null;
}

/**
 * Check if the event action is supported for processing
 */
export function isSupportedEvent(eventType: string, action: string): boolean {
  const supportedActions = SUPPORTED_EVENTS[eventType];
  return supportedActions?.includes(action) ?? false;
}

/**
 * Transform GitHub issue state to CardStatus
 */
function mapIssueState(state: "open" | "closed"): CardStatus {
  return state === "open" ? "open" : "closed";
}

/**
 * Transform GitHub PR state to CardStatus
 */
function mapPullRequestState(state: "open" | "closed", isDraft: boolean, isMerged: boolean): CardStatus {
  if (isDraft) return "draft";
  if (isMerged) return "merged";
  return state === "open" ? "open" : "closed";
}

/**
 * Transform webhook labels to CardLabel format
 */
function transformLabels(labels: { name: string; color: string }[]): CardLabel[] {
  return labels.map((label) => ({
    name: label.name,
    color: label.color,
  }));
}

/**
 * Transform a GitHub issue from webhook to CardData
 */
function issueToCardData(issue: GitHubWebhookIssue, repository: GitHubWebhookRepository): CardData {
  return {
    id: issue.node_id,
    title: issue.title,
    status: mapIssueState(issue.state),
    labels: transformLabels(issue.labels),
    repository: {
      owner: repository.owner.login,
      name: repository.name,
    },
    number: issue.number,
    createdAt: issue.created_at,
    commentCount: issue.comments,
    url: issue.html_url,
  };
}

/**
 * Transform a GitHub pull request from webhook to CardData
 */
function pullRequestToCardData(pr: GitHubWebhookPullRequest, repository: GitHubWebhookRepository): CardData {
  return {
    id: pr.node_id,
    title: pr.title,
    status: mapPullRequestState(pr.state, pr.draft, pr.merged),
    labels: transformLabels(pr.labels),
    repository: {
      owner: repository.owner.login,
      name: repository.name,
    },
    number: pr.number,
    createdAt: pr.created_at,
    commentCount: pr.comments,
    url: pr.html_url,
  };
}

/**
 * Parse an issue event and extract affected users
 */
function parseIssueEvent(payload: IssueEventPayload): AffectedUser[] {
  const affectedUsers: AffectedUser[] = [];
  const cardData = issueToCardData(payload.issue, payload.repository);

  switch (payload.action) {
    case "opened":
      // issues.opened -> Issues Created column for the author
      affectedUsers.push({
        githubUserId: payload.issue.user.id.toString(),
        columnType: "issues-created",
        cardData,
      });
      break;

    case "assigned":
      // issues.assigned -> Issues Assigned column for the assignee
      // The assignee field contains the newly assigned user
      if (payload.assignee) {
        affectedUsers.push({
          githubUserId: payload.assignee.id.toString(),
          columnType: "issues-assigned",
          cardData,
        });
      }
      break;
  }

  return affectedUsers;
}

/**
 * Parse a pull request event and extract affected users
 */
function parsePullRequestEvent(payload: PullRequestEventPayload): AffectedUser[] {
  const affectedUsers: AffectedUser[] = [];
  const cardData = pullRequestToCardData(payload.pull_request, payload.repository);

  switch (payload.action) {
    case "opened":
      // pull_request.opened -> Pull Requests column for the author
      affectedUsers.push({
        githubUserId: payload.pull_request.user.id.toString(),
        columnType: "pull-requests",
        cardData,
      });
      break;

    case "review_requested":
      // pull_request.review_requested -> Review Requests column for the reviewer
      // The requested_reviewer field contains the newly requested reviewer
      if (payload.requested_reviewer) {
        affectedUsers.push({
          githubUserId: payload.requested_reviewer.id.toString(),
          columnType: "review-requests",
          cardData,
        });
      }
      break;
  }

  return affectedUsers;
}

/**
 * Type guard to check if payload is an issue event
 */
function isIssueEvent(payload: WebhookPayload): payload is IssueEventPayload {
  return "issue" in payload;
}

/**
 * Type guard to check if payload is a pull request event
 */
function isPullRequestEvent(payload: WebhookPayload): payload is PullRequestEventPayload {
  return "pull_request" in payload;
}

/**
 * Main entry point: parse a webhook event and return affected users
 *
 * @param eventType - The X-GitHub-Event header value
 * @param payload - The parsed JSON payload
 * @returns ParsedWebhookEvent with affected users or null if event is not supported
 */
export function parseWebhookEvent(
  eventType: "issues" | "pull_request",
  payload: WebhookPayload,
): ParsedWebhookEvent | null {
  // Get the action from the payload
  const action = payload.action;

  // Check if this event/action combination is supported
  if (!isSupportedEvent(eventType, action)) {
    return null;
  }

  let affectedUsers: AffectedUser[] = [];

  if (eventType === "issues" && isIssueEvent(payload)) {
    affectedUsers = parseIssueEvent(payload);
  } else if (eventType === "pull_request" && isPullRequestEvent(payload)) {
    affectedUsers = parsePullRequestEvent(payload);
  }

  // If no users affected (edge case), return null
  if (affectedUsers.length === 0) {
    return null;
  }

  // Extract repository info
  const repository = isIssueEvent(payload) ? payload.repository : (payload as PullRequestEventPayload).repository;

  return {
    eventType,
    action,
    affectedUsers,
    repository: {
      owner: repository.owner.login,
      name: repository.name,
    },
  };
}
