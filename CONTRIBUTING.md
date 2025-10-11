# Contributing to FocusDeck

Thank you for your interest in contributing to FocusDeck! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Branching Strategy](#branching-strategy)
- [Commit Message Guidelines](#commit-message-guidelines)
- [Pull Request Process](#pull-request-process)
- [Code Quality Standards](#code-quality-standards)

## Getting Started

### Prerequisites

- Node.js 20+ and npm
- A GitHub account
- Git configured with your name and email

### Initial Setup

1. Fork the repository (if you're an external contributor)
2. Clone your fork or the main repository:

   ```bash
   git clone https://github.com/yourusername/focusdeck.git
   cd focusdeck
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Set up environment variables by creating a `.env.local` file:

   ```env
   AUTH_GITHUB_ID=your_github_oauth_app_client_id
   AUTH_GITHUB_SECRET=your_github_oauth_app_client_secret
   AUTH_SECRET=your_nextauth_secret
   ```

   To create a GitHub OAuth App:

   - Go to GitHub Settings → Developer settings → OAuth Apps → New OAuth App
   - Set Homepage URL to `http://localhost:3000`
   - Set Authorization callback URL to `http://localhost:3000/api/auth/callback/github`

5. Run the development server:
   ```bash
   npm run dev
   ```

## Development Workflow

### Git Hooks (Automatic)

This project uses [Husky](https://typicode.github.io/husky/) to enforce code quality automatically. When you commit, the following checks run:

**Pre-commit** (runs on `git commit`):

- Prettier formats all staged files
- ESLint fixes JavaScript/TypeScript issues
- TypeScript compiler checks for type errors
- GraphQL codegen runs if GraphQL files changed

**Commit-msg** (validates commit message):

- Ensures commit messages follow conventional commit format

If any check fails, the commit will be rejected. Fix the issues and try again.

### GraphQL Development

When working with GraphQL queries:

1. Update or add queries in `src/graphql/queries.ts` using the `gql` template tag
2. The pre-commit hook will automatically run `npm run codegen:compile`
3. Alternatively, use watch mode during development:
   ```bash
   npm run codegen:watch
   ```

Generated TypeScript types appear in `src/graphql/__generated__/` - **never edit these files manually**.

## Branching Strategy

### Branch Naming Convention

Use descriptive branch names with the following prefixes:

- `feat/` - New features (e.g., `feat/add-pr-review-cards`)
- `fix/` - Bug fixes (e.g., `fix/token-refresh-error`)
- `docs/` - Documentation changes (e.g., `docs/update-contributing`)
- `refactor/` - Code refactoring (e.g., `refactor/apollo-client-setup`)
- `style/` - UI/styling changes (e.g., `style/card-hover-effects`)
- `test/` - Adding or updating tests (e.g., `test/auth-flow`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Workflow

1. **Create a feature branch** from `main`:

   ```bash
   git checkout main
   git pull origin main
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** with frequent, atomic commits

3. **Keep your branch up to date**:

   ```bash
   git checkout main
   git pull origin main
   git checkout feat/your-feature-name
   git rebase main
   ```

4. **Push your branch**:

   ```bash
   git push origin feat/your-feature-name
   ```

5. **Open a Pull Request** on GitHub

## Commit Message Guidelines

This project follows the [Conventional Commits](https://www.conventionalcommits.org/) specification.

### Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Commit Types

- `feat` - New feature for the user
- `fix` - Bug fix for the user
- `docs` - Documentation only changes
- `style` - Code style changes (formatting, missing semicolons, whitespace, etc.)
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `build` - Changes to build system or dependencies
- `ci` - CI/CD configuration changes
- `chore` - Other changes that don't modify src or test files
- `revert` - Revert a previous commit

### Rules

- **Header max length**: 100 characters
- **Subject case**: Sentence case (capitalize first letter)
- **No period** at the end of the subject
- **Scope**: Optional, use lowercase (e.g., `feat(auth): add token refresh`)

### Examples

```bash
feat: add pull request review cards to dashboard

fix(auth): resolve token refresh infinite loop

docs: update GraphQL codegen instructions in CLAUDE.md

style: improve card hover animations

refactor(graphql): simplify Apollo Client configuration

test(auth): add tests for session refresh logic

chore: update dependencies to latest versions
```

### Breaking Changes

For breaking changes, add `!` after the type or include `BREAKING CHANGE:` in the footer:

```bash
feat!: redesign card component API

BREAKING CHANGE: Card component now requires `data` prop instead of individual props
```

## Pull Request Process

### Before Submitting

1. **Ensure all checks pass**:

   ```bash
   npm run lint        # Run ESLint
   npm run build       # Ensure production build works
   ```

2. **Test your changes** thoroughly

3. **Update documentation** if you changed functionality

4. **Rebase on main** to ensure a clean history:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

### PR Title and Description

- **Title**: Use the same format as commit messages (conventional commits)
- **Description**: Include:
  - What changes were made and why
  - How to test the changes
  - Screenshots/GIFs for UI changes
  - Related issues (e.g., "Closes #123")

### Example PR Description

```markdown
## Changes

- Added PR review cards to the dashboard
- Implemented notification badge for pending reviews
- Added GraphQL query for fetching review requests

## Testing

1. Sign in with GitHub account
2. Navigate to dashboard
3. Verify PRs awaiting review appear in the "Reviews" column
4. Check notification badge displays correct count

## Screenshots

[Attach screenshot]

Closes #42
```

### Review Process

1. A maintainer will review your PR
2. Address any requested changes
3. Once approved, a maintainer will merge your PR
4. Your branch will be automatically deleted after merge

## Code Quality Standards

### TypeScript

- **Strict mode enabled** - no implicit `any` types
- Use proper type annotations for function parameters and return types
- Prefer `interface` over `type` for object shapes
- Use path aliases (`@/`) for cleaner imports

### React/Next.js

- Use **Server Components** by default
- Add `"use client"` only when necessary (for interactivity)
- Prefer composition over prop drilling
- Extract reusable logic into custom hooks

### Styling

- Use **Tailwind CSS** utility classes
- Follow the project's Prettier config (120 char line width)
- Keep utility classes sorted (automatically done by Prettier plugin)
- Use semantic color classes from the Tailwind config

### GraphQL

- Define all queries in `src/graphql/queries.ts`
- Use the `gql` template tag for type safety
- Keep queries focused and fetch only needed fields
- Use fragments for reusable field selections

### Git Practices

- **Atomic commits** - one logical change per commit
- **Descriptive commit messages** - explain the "why" not just the "what"
- **Rebase, don't merge** - keep a linear history
- **No merge commits** in feature branches
- **Squash related commits** before final PR if needed

## Questions or Issues?

- Open a [GitHub Issue](https://github.com/yourusername/focusdeck/issues) for bugs or feature requests
- Check existing issues before creating a new one
- Include reproduction steps for bugs

---

Thank you for contributing to FocusDeck! 🚀
