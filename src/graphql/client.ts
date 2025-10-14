import { ApolloClient, createHttpLink, InMemoryCache, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { onError } from "@apollo/client/link/error";
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";

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
      console.error(`[GraphQL error]: Message: ${err.message}, Location: ${err.locations}, Path: ${err.path}`);

      // Handle authentication errors
      if (err.extensions?.code === "UNAUTHENTICATED") {
        console.error("GraphQL authentication error - token may be invalid or expired");
      }
    }
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError.message}`);

    // Handle 401 Unauthorized
    if ("statusCode" in networkError && networkError.statusCode === 401) {
      console.error("Received 401 Unauthorized - token may be expired or invalid");
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
