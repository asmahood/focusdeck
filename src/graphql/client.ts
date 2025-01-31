import { auth } from "@/auth";
import { ApolloClient, createHttpLink, InMemoryCache } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: "https://api.github.com/graphql",
});

const authLink = setContext(async (_, { headers }) => {
  const session = await auth();

  const token = session?.user.accessToken ?? "";

  return {
    headers: {
      ...headers,
      authorization: `bearer ${token}`,
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export { client };
