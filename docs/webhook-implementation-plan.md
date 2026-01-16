# GitHub Webhooks + Real-Time Updates Implementation Plan

## Overview

Implement real-time updates for all 4 dashboard columns (Issues Created, Issues Assigned, Pull Requests, Review Requests) using GitHub App webhooks and Server-Sent Events (SSE).

**User Experience:** When a new item appears in GitHub, it automatically appears at the top of the corresponding column without manual refresh.

**Technology Stack:**

- GitHub App webhooks (server-side events from GitHub)
- Server-Sent Events (SSE) for server→browser updates
- In-memory connection manager (for MVP; can upgrade to Redis later)

---

## 1. GitHub App Setup (Non-Code Steps)

### 1.1 Convert Existing OAuth App to GitHub App

Since you're already using GitHub OAuth for authentication, you'll need to create a GitHub App (can coexist with OAuth):

**Steps:**

1. Go to GitHub Settings → Developer settings → GitHub Apps → New GitHub App
2. **App Name:** "FocusDeck" (or your preferred name)
3. **Homepage URL:** Your app's URL (e.g., `https://focusdeck.com`)
4. **Webhook URL:** `https://your-domain.com/api/webhooks/github`
5. **Webhook Secret:** Generate a strong secret (store in `.env.local` as `GITHUB_WEBHOOK_SECRET`)
6. **Permissions (Repository):**
   - Issues: Read-only
   - Pull requests: Read-only
   - Metadata: Read-only
7. **Permissions (Organization):**
   - Members: Read-only (for "assigned to you" events)
8. **Subscribe to Events:**
   - Issues (for issues created/assigned)
   - Pull request (for PRs created)
   - Pull request review (for review requests)
9. **Where can this GitHub App be installed:** Any account
10. Create the app and note the **App ID** and generate a **Private Key** (download the `.pem` file)

### 1.2 Environment Variables

Add to `.env.local`:

```
GITHUB_APP_ID=your_app_id
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n..."

# Vercel KV (auto-configured on Vercel, manual for local dev)
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
```

For local development with Vercel KV:

1. Create a KV store in Vercel dashboard
2. Link your project: `vercel link`
3. Pull environment variables: `vercel env pull .env.local`

### 1.3 User Installation Flow

Users will need to install the GitHub App to enable webhooks:

1. Add an "Enable Real-Time Updates" button in dashboard settings
2. Link to `https://github.com/apps/focusdeck/installations/new`
3. User selects repositories to monitor
4. GitHub redirects back to your callback URL with `installation_id`
5. Store the `installation_id` mapped to the user's GitHub ID

---

## 2. Backend Architecture

### 2.1 Webhook Endpoint

**Route:** `/api/webhooks/github`

**Responsibilities:**

1. Validate webhook signature using `GITHUB_WEBHOOK_SECRET`
2. Parse webhook event type and payload
3. Determine which user(s) should receive the update
4. Transform webhook data into `CardData` format
5. Send to SSE connection manager for broadcasting

**Event Mapping:**

- `issues.opened` → Issues Created (if user is author)
- `issues.assigned` → Issues Assigned (if user is assignee)
- `pull_request.opened` → Pull Requests Created (if user is author)
- `pull_request.review_requested` → Review Requests (if user is requested reviewer)

### 2.2 SSE Endpoint

**Route:** `/api/sse`

**Responsibilities:**

1. Authenticate the user via NextAuth session
2. Create SSE connection with proper headers
3. Register connection in ConnectionManager with user's GitHub ID
4. Send periodic heartbeat to keep connection alive
5. Clean up on disconnect

**SSE Response Format:**

```typescript
event: new-item
data: {"columnType": "reviews", "item": {...CardData}}

event: heartbeat
data: {"timestamp": 1234567890}
```

### 2.3 Connection Manager

**In-Memory Manager (MVP):**

- Map: `githubUserId → Set<SSE Response objects>`
- Handles multiple connections per user (multiple tabs/devices)
- Broadcasts events to all connections for a user
- Cleanup on disconnect

**Future Enhancement:** Redis Pub/Sub for multi-instance deployments

### 2.4 Installation Storage

**Vercel KV (Redis):**

- Store: `user:{githubUserId}:installation` → `installation_id`
- Needed to identify which GitHub App installation belongs to each user
- Simple setup: `npm install @vercel/kv`
- Environment variable: `KV_REST_API_URL` and `KV_REST_API_TOKEN` (auto-configured on Vercel)

**Operations:**

```typescript
// Store installation
await kv.set(`user:${githubUserId}:installation`, installationId);

// Retrieve installation
const installationId = await kv.get(`user:${githubUserId}:installation`);

// Delete on uninstall
await kv.del(`user:${githubUserId}:installation`);
```

---

## 3. Frontend Integration

### 3.1 SSE Client Hook

Create `useRealtimeUpdates()` hook:

- Establishes SSE connection to `/api/sse`
- Listens for `new-item` events
- Calls callback with `{ columnType, item }`
- Auto-reconnects on disconnect with exponential backoff
- Cleans up on unmount

### 3.2 Dashboard Integration

**DashboardColumn Component Changes:**

1. Import `useRealtimeUpdates()`
2. Register callback for column type
3. When new item arrives:
   - Insert at position 0: `setItems(prev => [newItem, ...prev])`
   - Increment `totalCount`
   - Add visual indicator (brief highlight/animation)

### 3.3 Deduplication

Prevent duplicate cards if webhook arrives for item already in the list:

- Check if `item.id` already exists in `items[]`
- Skip insert if duplicate

### 3.4 Filter Matching

Only insert items that match current column criteria:

- Issues Created: Author is current user
- Issues Assigned: User is in assignees
- Pull Requests: Author is current user
- Review Requests: User is in requested reviewers

---

## 4. Data Flow

```
GitHub Event
    ↓
Webhook Endpoint (/api/webhooks/github)
    ↓
Validate Signature
    ↓
Parse Event → Determine Affected Users
    ↓
Transform to CardData
    ↓
ConnectionManager.broadcast(userId, columnType, item)
    ↓
SSE Connections for that user
    ↓
Browser receives SSE event
    ↓
useRealtimeUpdates() callback
    ↓
DashboardColumn updates state
    ↓
New card appears at top
```

---

## 5. File Changes Required

### New Files

**API Routes:**

- `src/app/api/webhooks/github/route.ts` - Webhook receiver
- `src/app/api/sse/route.ts` - SSE endpoint

**Services/Utilities:**

- `src/lib/webhooks/validateSignature.ts` - Webhook signature validation
- `src/lib/webhooks/eventParser.ts` - Parse GitHub webhook events
- `src/lib/webhooks/connectionManager.ts` - SSE connection management
- `src/lib/webhooks/types.ts` - Webhook-related types
- `src/lib/kv/installations.ts` - Vercel KV installation management

**Frontend:**

- `src/hooks/useRealtimeUpdates.ts` - SSE client hook

**Configuration:**

- Update `.env.local` with new environment variables

### Modified Files

**Components:**

- `src/components/DashboardColumn.tsx` - Integrate `useRealtimeUpdates()`

**Hooks (if needed for deduplication):**

- `src/hooks/useIssuesCreated.ts` - Add `prependItem()` method
- `src/hooks/useIssuesAssigned.ts` - Add `prependItem()` method
- `src/hooks/usePullRequests.ts` - Add `prependItem()` method
- `src/hooks/useReviewRequests.ts` - Add `prependItem()` method

**Types:**

- `src/types/webhooks.ts` (new) - GitHub webhook event types
- `src/types/sse.ts` (new) - SSE message types

---

## 6. Implementation Steps

### Phase 1: Setup & Dependencies

1. Install dependencies: `npm install @vercel/kv octokit`
2. Create GitHub App (see section 1.1)
3. Set up Vercel KV store in Vercel dashboard
4. Add environment variables to `.env.local`
5. Pull Vercel env vars locally: `vercel env pull .env.local`

### Phase 2: Vercel KV Integration

1. Create `src/lib/kv/installations.ts` with helper functions:
   - `setInstallation(githubUserId, installationId)`
   - `getInstallation(githubUserId)`
   - `deleteInstallation(githubUserId)`
2. Create types for installation data

### Phase 3: Webhook Infrastructure

1. Create `src/lib/webhooks/validateSignature.ts`
2. Create `src/lib/webhooks/eventParser.ts` with:
   - Event type detection
   - User extraction from payload
   - Transform to CardData
3. Create `src/lib/webhooks/types.ts` for GitHub webhook types
4. Implement `/api/webhooks/github/route.ts`
5. Test with GitHub webhook delivery console

### Phase 4: SSE Infrastructure

1. Create `src/lib/webhooks/connectionManager.ts` (in-memory singleton)
2. Implement `/api/sse/route.ts` with:
   - Authentication check
   - SSE headers configuration
   - Heartbeat every 30 seconds
   - Connection registration/cleanup
3. Test SSE connection with browser EventSource

### Phase 5: Frontend Integration

1. Create `src/hooks/useRealtimeUpdates.ts` with:
   - EventSource setup
   - Auto-reconnect with exponential backoff
   - Event parsing and callback dispatch
2. Modify `src/components/DashboardColumn.tsx`:
   - Import and use `useRealtimeUpdates()`
   - Add prepend logic: `setItems(prev => [newItem, ...prev])`
   - Add deduplication check
   - Optional: Add brief visual highlight for new cards
3. Test end-to-end with manual GitHub events

### Phase 6: GitHub App Installation Flow

1. Create `/api/github-app/callback/route.ts` for installation callback
2. Create `/api/github-app/status/route.ts` to check installation status
3. Add installation UI to dashboard (button to install app)
4. Handle `installation.deleted` webhook to cleanup KV data
5. Test installation and uninstallation

### Phase 7: Polish & Production Readiness

1. Add reconnection logic with exponential backoff in `useRealtimeUpdates`
2. Add rate limiting to SSE endpoint (max 5 connections per user)
3. Add structured logging for webhook events
4. Add error boundaries for SSE connection failures
5. Add monitoring/alerting for webhook delivery failures
6. Document setup process in README

---

## 7. Edge Cases & Considerations

### Multiple Browser Tabs

- Each tab gets its own SSE connection
- ConnectionManager sends to all connections for a user
- Each tab independently updates its state

### Webhook Arrives When User Offline

- Event is lost (acceptable for real-time updates)
- User will see item on next page load or refresh
- Future enhancement: Queue recent events in Redis with TTL

### Item Doesn't Match Filter

- Event parser checks criteria before broadcasting
- Example: PR opened by someone else → skip for "PRs Created"

### GitHub App Not Installed

- Webhooks won't arrive (graceful degradation)
- App continues to work with manual refresh
- Show installation prompt in settings

### Rate Limiting

- Limit SSE connections per user (e.g., 5 max)
- Limit webhook processing rate (if needed)

### Security

- Webhook signature validation (REQUIRED)
- SSE endpoint authentication via NextAuth
- Don't expose installation tokens to client

---

## 8. Testing Strategy

1. **Webhook Validation:** Unit tests for signature verification
2. **Event Parsing:** Unit tests for each webhook event type
3. **SSE Connection:** Integration test for connect/disconnect
4. **End-to-End:** Create real GitHub issues/PRs and verify updates appear
5. **Edge Cases:** Test with multiple tabs, offline scenarios

---

## 9. Future Enhancements

1. **Redis for Scaling:** Replace in-memory ConnectionManager with Redis Pub/Sub
2. **Event Queue:** Store recent events in Redis for offline users
3. **WebSocket Option:** Allow users to choose WebSocket for bidirectional features
4. **Notification Settings:** Let users configure which events trigger updates
5. **Sound/Visual Alerts:** Optional notification sounds for new items

---

## 10. Security Checklist

- [ ] Validate webhook signatures on every request
- [ ] Authenticate SSE connections via NextAuth
- [ ] Store GitHub App private key securely (env var, not in code)
- [ ] Rate limit webhook endpoint to prevent abuse
- [ ] Don't expose installation tokens to client-side code
- [ ] Validate event payloads before processing
- [ ] Use HTTPS for webhook URL (required by GitHub)

---

## Critical Files to Review Before Implementation

1. `src/components/DashboardColumn.tsx` - Understand current state management
2. `src/hooks/useIssuesCreated.ts` - Pattern for other hooks
3. `src/lib/fetchers/types.ts` - FetchResult and CardData types
4. `src/types/card.ts` - CardData interface
5. `src/auth.ts` - Authentication patterns for SSE endpoint
6. `src/lib/api/auth.ts` - verifyAuthentication helper
