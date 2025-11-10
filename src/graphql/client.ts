import { ApolloClient, createHttpLink, InMemoryCache, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { logger } from "@/lib/logging/logger";

const httpLink = createHttpLink({
  uri: "https://api.github.com/graphql",
});

const authLink = setContext(async (_, { headers }) => {
  // Get the JWT token directly (server-side only)
  // Note: getToken expects a NextRequest but we're in a server-side context
  // We provide the minimal interface it needs (headers with cookie)
  const cookieHeader = (await cookies()).toString();
  const token = await getToken({
    req: {
      headers: {
        cookie: cookieHeader,
      },
    } as Parameters<typeof getToken>[0]["req"],
    secret: process.env.AUTH_SECRET,
  });

  if (!token?.accessToken) {
    throw new Error("No access token available");
  }

  // Check for token refresh errors
  if (token.error === "RefreshTokenError") {
    throw new Error("Token refresh failed - re-authentication required");
  }

  return {
    headers: {
      ...headers,
      authorization: `bearer ${token.accessToken}`,
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      logger.error("GraphQL error", {
        message: err.message,
        locations: err.locations,
        path: err.path,
        extensions: err.extensions,
      });

      // Handle authentication errors
      if (err.extensions?.code === "UNAUTHENTICATED") {
        logger.warn("Authentication error detected", {
          code: err.extensions.code,
        });
      }
    }
  }

  if (networkError) {
    logger.error("Network error", {
      message: networkError.message,
      name: networkError.name,
      statusCode: "statusCode" in networkError ? networkError.statusCode : undefined,
    });

    // Handle 401 Unauthorized - this means the token is invalid/expired
    if ("statusCode" in networkError && networkError.statusCode === 401) {
      logger.warn("401 Unauthorized - authentication required");
    }
  }
});

const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
    },
  },
});

export { client };
