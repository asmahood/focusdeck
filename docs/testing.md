# Testing Guide for FocusDeck

This guide explains the testing infrastructure, best practices, and how to write effective tests for the FocusDeck Next.js application.

## Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [MSW Setup](#msw-setup)
- [Testing Patterns](#testing-patterns)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

FocusDeck uses a modern testing stack with Jest, React Testing Library, and Mock Service Worker (MSW) to ensure reliable, maintainable tests. Our testing philosophy emphasizes:

- **Testing user behavior** rather than implementation details
- **Mocking external APIs** with MSW instead of component internals
- **Accessibility-first** testing using semantic queries
- **Type safety** with TypeScript throughout tests

## Testing Stack

### Core Dependencies

- **Jest 30**: Test runner and assertion library
- **React Testing Library 16**: Component testing utilities
- **@testing-library/jest-dom**: Custom DOM matchers
- **@testing-library/user-event**: Realistic user interaction simulation
- **MSW 2**: API mocking for HTTP and GraphQL requests
- **jest-environment-jsdom**: Browser-like environment for tests

### Configuration Files

- `jest.config.ts` - Jest configuration with Next.js integration
- `jest.setup.ts` - Global test setup (jest-dom, console suppressions)
- `src/mocks/` - MSW mock server and handlers (opt-in per test file)
- `tsconfig.json` - TypeScript includes test globals

## Project Structure

```
focusdeck/
├── src/
│   ├── components/
│   │   ├── __tests__/          # Component tests
│   │   │   ├── SignInError.test.tsx
│   │   │   ├── SignInForm.test.tsx
│   │   │   └── Dashboard.example.test.tsx
│   │   └── *.tsx               # Components
│   ├── mocks/
│   │   ├── handlers.ts         # MSW request handlers
│   │   ├── server.ts           # MSW Node.js server
│   │   ├── browser.ts          # MSW browser worker
│   │   └── index.ts            # Exports
│   └── app/
├── jest.config.ts              # Jest configuration
├── jest.setup.ts               # Test environment setup
└── docs/
    └── testing.md              # This file
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run specific test file
npm test -- SignInError.test.tsx

# Run tests matching a pattern
npm test -- --testNamePattern="should render"
```

### Test Scripts (package.json)

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

### Pre-commit Hooks

Tests are NOT automatically run on commit to keep commits fast. However, TypeScript type checking runs via Husky:

```bash
# Pre-commit hook runs:
npx tsc --noEmit
```

CI/CD pipelines should run the full test suite.

## Writing Tests

### Basic Component Test

```tsx
import { render, screen } from "@testing-library/react";
import { MyComponent } from "../MyComponent";

describe("MyComponent", () => {
  it("should render with correct text", () => {
    render(<MyComponent title="Hello" />);

    expect(screen.getByText("Hello")).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SignInButton } from "../SignInButton";

describe("SignInButton", () => {
  it("should call onClick when clicked", async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();

    render(<SignInButton onClick={handleClick} />);

    const button = screen.getByRole("button", { name: /sign in/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing Async Components

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import { Dashboard } from "../Dashboard";

describe("Dashboard", () => {
  it("should load and display issues", async () => {
    render(<Dashboard />);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.getByText("Test Issue 1")).toBeInTheDocument();
    });
  });
});
```

## MSW Setup

### What is MSW?

Mock Service Worker (MSW) intercepts HTTP requests at the network level, providing realistic API mocking without touching your application code.

**Benefits:**

- ✅ Mock at the network level (most realistic)
- ✅ Same mocks for tests, Storybook, and development
- ✅ No need to mock fetch, Apollo Client, or other HTTP libraries
- ✅ Catch unhandled requests during development
- ✅ Fully typed with TypeScript

### MSW Files

#### `src/mocks/server.ts` (Node.js / Jest)

```typescript
import { setupServer } from "msw/node";
import { handlers } from "./handlers";

export const server = setupServer(...handlers);
```

#### `src/mocks/browser.ts` (Browser / Storybook)

```typescript
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);
```

#### `src/mocks/handlers.ts`

Define mock handlers for your APIs:

```typescript
import { graphql, http, HttpResponse } from "msw";

export const handlers = [
  // GraphQL query
  graphql.query("GetUserIssues", () => {
    return HttpResponse.json({
      data: {
        viewer: {
          issues: {
            nodes: [
              {
                id: "issue-1",
                title: "Test Issue",
                state: "OPEN",
              },
            ],
          },
        },
      },
    });
  }),

  // REST endpoint
  http.get("https://api.github.com/user", () => {
    return HttpResponse.json({
      login: "testuser",
      name: "Test User",
    });
  }),
];
```

### Using MSW in Tests

**Important:** MSW is NOT automatically enabled for all tests. Only import and use MSW in integration tests that actually make HTTP/GraphQL requests. This keeps unit tests fast and avoids unnecessary complexity.

#### Enabling MSW for Specific Tests

Import and set up MSW server in test files that need it:

```typescript
// Dashboard.test.tsx (integration test with API calls)
import { server } from "@/mocks/server";

// Set up MSW for this test file
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Dashboard", () => {
  it("should fetch and display issues", async () => {
    // Test makes real GraphQL requests (mocked by MSW)
    render(<Dashboard />);
    await waitFor(() => {
      expect(screen.getByText("Test Issue")).toBeInTheDocument();
    });
  });
});
```

#### When to Use MSW

✅ **Use MSW for:**

- Integration tests with API calls
- Components that fetch data
- GraphQL query/mutation testing
- Testing loading/error states

❌ **Don't use MSW for:**

- Pure presentational components
- UI-only tests (buttons, forms without submission)
- Unit tests without network requests

#### Per-Test Handlers

Override default handlers for specific tests:

```typescript
import { server } from "@/mocks/server";
import { graphql, HttpResponse } from "msw";

it("should handle error response", async () => {
  // Override for this test only
  server.use(
    graphql.query("GetUserIssues", () => {
      return HttpResponse.json({
        errors: [{ message: "Authentication required" }],
      });
    }),
  );

  // Test error handling...
});
```

#### Testing Network Errors

```typescript
it("should handle network failure", async () => {
  server.use(
    graphql.query("GetUserIssues", () => {
      return HttpResponse.error();
    }),
  );

  // Test network error handling...
});
```

#### Testing Loading States

```typescript
it("should show loading state", async () => {
  server.use(
    graphql.query("GetUserIssues", async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      return HttpResponse.json({ data: { viewer: { issues: [] } } });
    })
  );

  render(<Dashboard />);

  // Check for loading spinner
  expect(screen.getByRole("status")).toBeInTheDocument();
});
```

### GraphQL-Specific Mocking

Since FocusDeck uses Apollo Client with GitHub's GraphQL API:

```typescript
import { graphql, HttpResponse } from "msw";

// Query handler
graphql.query("GetCreatedIssues", ({ query, variables }) => {
  console.log("Query:", query);
  console.log("Variables:", variables);

  return HttpResponse.json({
    data: {
      viewer: {
        issues: {
          edges: [
            {
              node: {
                title: "Mock Issue",
                repository: { name: "mock-repo" },
              },
            },
          ],
        },
      },
    },
  });
});

// Mutation handler
graphql.mutation("CreateIssue", ({ variables }) => {
  return HttpResponse.json({
    data: {
      createIssue: {
        issue: {
          id: "new-issue-id",
          title: variables.title,
        },
      },
    },
  });
});

// Catch-all for debugging
graphql.operation(({ operationName }) => {
  console.warn(`Unhandled GraphQL: ${operationName}`);
  return HttpResponse.json({
    errors: [{ message: `No handler for ${operationName}` }],
  });
});
```

## Testing Patterns

### 1. Component Tests (Unit)

Test individual components in isolation:

```tsx
describe("SignInError", () => {
  it("should display error message", () => {
    render(<SignInError error="AccessDenied" />);
    expect(screen.getByText(/access was denied/i)).toBeInTheDocument();
  });
});
```

**When to use:**

- Presentational components
- UI logic without API calls
- Form validation
- Accessibility testing

### 2. Integration Tests

Test component interactions and data flow:

```tsx
describe("Dashboard Integration", () => {
  it("should fetch and display issues", async () => {
    const { getByText } = render(<Dashboard />);

    await waitFor(() => {
      expect(getByText("Test Issue 1")).toBeInTheDocument();
    });
  });
});
```

**When to use:**

- Components with data fetching
- Multi-component interactions
- Form submissions
- State management flows

### 3. Server Action Tests

Test Next.js Server Actions:

```tsx
import { signIn } from "../actions";

describe("signIn action", () => {
  it("should redirect to dashboard on success", async () => {
    // Mock NextAuth signIn
    const result = await signIn(new FormData());

    expect(result).toEqual({ redirect: "/dashboard" });
  });
});
```

### 4. Accessibility Tests

Ensure components are accessible:

```tsx
it("should have proper ARIA attributes", () => {
  render(<SignInError error="AccessDenied" />);

  const alert = screen.getByRole("alert");
  expect(alert).toHaveAttribute("aria-live", "assertive");
});
```

**Always test:**

- Semantic HTML elements
- ARIA attributes
- Keyboard navigation
- Screen reader announcements

## Best Practices

### 1. Query Priority

Use queries in this order (most to least preferred):

1. **getByRole** - Accessible to screen readers
2. **getByLabelText** - Form inputs
3. **getByPlaceholderText** - Placeholder text
4. **getByText** - Non-interactive content
5. **getByTestId** - Last resort only

```tsx
// ✅ Good - Semantic query
screen.getByRole("button", { name: /sign in/i });

// ❌ Bad - Test ID
screen.getByTestId("signin-button");
```

### 2. Avoid Implementation Details

Test what users see, not how it's built:

```tsx
// ✅ Good - Test user-facing behavior
expect(screen.getByText("Welcome")).toBeInTheDocument();

// ❌ Bad - Test implementation
expect(component.state.isWelcomeShown).toBe(true);
```

### 3. Don't Mock Internal Modules

Use MSW for external APIs, not internal mocks:

```tsx
// ✅ Good - Mock API with MSW
server.use(
  graphql.query("GetUserIssues", () => {
    return HttpResponse.json({ data: { ... } });
  })
);

// ❌ Bad - Mock internal module
jest.mock("@/graphql/client", () => ({
  useQuery: jest.fn().mockReturnValue({ data: { ... } }),
}));
```

### 4. Keep Tests Focused

One logical assertion per test:

```tsx
// ✅ Good - Single concern
it("should display error message", () => {
  render(<SignInError error="AccessDenied" />);
  expect(screen.getByText(/access was denied/i)).toBeInTheDocument();
});

// ❌ Bad - Multiple concerns
it("should work correctly", () => {
  render(<SignInError error="AccessDenied" />);
  expect(screen.getByText(/access was denied/i)).toBeInTheDocument();
  expect(screen.getByRole("button")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button"));
  expect(mockFn).toHaveBeenCalled();
});
```

### 5. Use Async Utilities

Always use async utilities for async operations:

```tsx
// ✅ Good - Proper async handling
await waitFor(() => {
  expect(screen.getByText("Loaded")).toBeInTheDocument();
});

// ❌ Bad - No async handling
expect(screen.getByText("Loaded")).toBeInTheDocument(); // May fail
```

### 6. Clean Up Between Tests

Tests should be independent:

```tsx
// Automatic cleanup via jest.setup.ts
afterEach(() => {
  server.resetHandlers(); // Reset MSW handlers
  cleanup(); // Clean up DOM (automatic with RTL)
});
```

### 7. Use TypeScript

Leverage type safety in tests:

```tsx
// ✅ Good - Typed properly
const mockProvider: Provider = {
  id: "github",
  name: "GitHub",
};

// ❌ Bad - Untyped
const mockProvider = {
  id: "github",
  name: "GitHub",
} as any;
```

## Troubleshooting

### Tests Failing with "Cannot find module '@testing-library/react'"

**Solution:** Ensure TypeScript includes test types:

```json
// tsconfig.json
{
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-dom"]
  }
}
```

### Tests Failing with "describe is not defined"

**Solution:** TypeScript needs Jest globals. Already configured in `tsconfig.json`.

### MSW Not Intercepting Requests

**Solution:** Ensure you've imported and started the MSW server in your test file:

```typescript
// YourComponent.test.tsx
import { server } from "@/mocks/server";

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

**Note:** MSW is not globally enabled. Only import it in tests that need API mocking.

### Apollo Client Errors in Tests

**Solution:** Wrap component with ApolloProvider:

```tsx
import { ApolloProvider } from "@apollo/client";
import { createApolloClient } from "@/graphql/client";

const client = createApolloClient("fake-token");

render(
  <ApolloProvider client={client}>
    <MyComponent />
  </ApolloProvider>,
);
```

### React 19 Act Warnings

**Solution:** Warnings are suppressed in `jest.setup.ts`. If needed, debug by commenting out the suppression.

### Tests Running Slowly

**Solutions:**

1. Reduce test timeout (default: 5s)
2. Use `screen.queryBy` instead of `waitFor` when not needed
3. Mock expensive operations
4. Run tests in parallel (Jest default)

```bash
# Run with specific timeout
npm test -- --testTimeout=10000

# Run tests serially (for debugging)
npm test -- --runInBand
```

### Coverage Not Including All Files

**Solution:** Ensure coverage paths in `jest.config.ts`:

```typescript
collectCoverageFrom: [
  "src/**/*.{js,jsx,ts,tsx}",
  "!src/**/*.d.ts",
  "!src/**/__tests__/**",
  "!src/graphql/__generated__/**",
],
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - run: npm ci
      - run: npm run codegen:compile
      - run: npm test -- --coverage
      - run: npx tsc --noEmit
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Examples

See working examples in:

- `/src/components/__tests__/SignInError.test.tsx` - Basic component test
- `/src/components/__tests__/SignInForm.test.tsx` - Form component test
- `/src/components/__tests__/Dashboard.example.test.tsx` - MSW integration test

---

**Last Updated:** 2025-10-11
**Maintainer:** FocusDeck Team
