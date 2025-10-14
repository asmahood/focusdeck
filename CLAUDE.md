# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FocusDeck is a Next.js 15 application that centralizes a GitHub user's work into a single dashboard view. It displays:

- Created issues and issues assigned to you
- Created pull requests and PRs assigned to you
- Pull requests awaiting your review
- Notification states for at-a-glance status of your GitHub universe

The app uses GitHub's GraphQL API for data fetching and NextAuth.js for OAuth authentication with automatic token refresh.

## Common Commands

### Development

```bash
npm run dev                  # Start dev server with Turbopack (requires GraphQL codegen first)
npm run build               # Build for production (runs GraphQL codegen before build)
npm start                   # Start production server
npm run lint                # Run ESLint
```

### GraphQL Code Generation

```bash
npm run codegen:compile     # Generate TypeScript types from GraphQL schema (required before dev/build)
npm run codegen:watch       # Watch mode for GraphQL codegen
```

**Important:** Always run `npm run codegen:compile` after modifying GraphQL queries in `src/graphql/queries.ts` or when starting fresh development.

## Architecture

### Authentication Flow

- **NextAuth.js v5** handles GitHub OAuth with custom token refresh logic
- Auth configuration: `src/auth.ts`
- **Security**: Access tokens are stored exclusively in JWT tokens (server-side only) and are NOT exposed in the session object
- Token refresh is handled automatically in the JWT callback when tokens expire
- Custom sign-in page at `/sign-in`
- Middleware at `middleware.ts` protects authenticated routes and handles token refresh errors

#### Accessing Tokens Server-Side

To access GitHub tokens in server components or API routes:

```typescript
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";

const cookieHeader = (await cookies()).toString();
const token = await getToken({
  req: {
    headers: {
      cookie: cookieHeader,
    },
  } as Parameters<typeof getToken>[0]["req"],
});

const accessToken = token?.accessToken; // GitHub access token
const refreshToken = token?.refreshToken; // GitHub refresh token
```

**Important**: Tokens are never exposed to client-side code for security. The GraphQL client in `src/graphql/client.ts` demonstrates the correct pattern for server-side token retrieval.

### GraphQL Integration

- **Apollo Client** for GitHub GraphQL API queries
- Schema: `src/graphql/github.api.schema.graphql` (GitHub API schema)
- Queries: `src/graphql/queries.ts` (use `gql` template tag for type-safe queries)
- Client: `src/graphql/client.ts` (configured with auth link that auto-injects access token)
- Generated types: `src/graphql/__generated__/` (auto-generated, do not edit manually)
- TypeScript plugin `@0no-co/graphqlsp` provides IDE autocomplete for GraphQL queries

### Code Generation Workflow

1. Write GraphQL queries in `src/graphql/queries.ts` using `gql` template tag
2. Run `npm run codegen:compile` to generate TypeScript types
3. Import and use type-safe queries with Apollo Client
4. Generated files in `src/graphql/__generated__/` provide full type safety

### Component Structure

- Components in `src/components/` with barrel export via `index.ts`
- `Card.tsx` and `CardColumn.tsx` are the main UI components for displaying cards
- Dashboard at `src/app/dashboard/page.tsx` displays the centralized work view

### Styling

- **Tailwind CSS** with custom config in `tailwind.config.ts`
- Prettier configured with Tailwind plugin for class sorting (120 char line width)
- Run Prettier via `npx prettier --write .` for formatting

### Path Aliases

- `@/*` maps to `src/*` (configured in `tsconfig.json`)
- Example: `import { client } from "@/graphql/client"`

## Environment Variables

Required in `.env.local`:

- `AUTH_GITHUB_ID` - GitHub OAuth App Client ID
- `AUTH_GITHUB_SECRET` - GitHub OAuth App Client Secret
- `AUTH_SECRET` - NextAuth.js secret for session encryption

## Key Technical Details

- Next.js App Router with Server Components
- TypeScript strict mode enabled
- React 19 and Next.js 15 with Turbopack for fast dev builds
- GraphQL schema file must be present at `src/graphql/github.api.schema.graphql`
