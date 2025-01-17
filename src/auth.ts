import NextAuth, { type DefaultSession } from "next-auth";
import { Provider } from "next-auth/providers";
import Github from "next-auth/providers/github";

declare module "next-auth" {
  /**
   * Returned by `auth`, `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    error?: "RefreshTokenError";

    user: {
      /** The user's Github access token. */
      accessToken: string;

      /** The refresh token for this Github access token */
      refreshToken: string;

      /** The time that the access token will expire (in seconds) */
      expiresAt: number;

      /**
       * By default, TypeScript merges new interface properties and overwrites existing ones.
       * In this case, the default session user properties will be overwritten,
       * with the new ones defined above. To keep the default session user properties,
       * you need to add them back into the newly declared interface.
       */
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    accessToken: string;
    expiresAt: number;
    refreshToken?: string;
    error?: "RefreshTokenError";
  }
}

const providers: Provider[] = [Github];

export const providerMap = providers.map((provider) => {
  if (typeof provider === "function") {
    const providerData = provider();
    return { id: providerData.id, name: providerData.name };
  }

  return { id: provider.id, name: provider.name };
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers,
  pages: {
    signIn: "/sign-in",
  },
  callbacks: {
    async jwt({ token, account }) {
      // First-time login, save the `access-token`, its expiry and the `refresh-token`
      if (account) {
        return {
          ...token,
          accessToken: account.access_token!,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at!,
        };
      } else if (Date.now() < token.expiresAt * 1000) {
        // Subsequent logins, `access-token` is still valid
        return token;
      } else {
        // Subsequent logins, but the `access-token` has expired, so try to refresh it
        if (!token.refreshToken) throw new TypeError("Missing refreshToken");

        try {
          // Construct URL to request a new token
          const url = new URL("https://github.com/login/oauth/access_token");
          url.searchParams.append("client_id", process.env.AUTH_GITHUB_ID!);
          url.searchParams.append("client_secret", process.env.AUTH_GITHUB_SECRET!);
          url.searchParams.append("grant_type", "refresh_token");
          url.searchParams.append("refresh_token", token.refreshToken);

          // Make the request to get the new token
          const response = await fetch(url, { method: "POST" });

          // Get the new tokens from the response
          const tokensOrError = await response.text();
          if (!response.ok) throw tokensOrError;
          const newTokens = new URLSearchParams(tokensOrError);

          return {
            ...token,
            accessToken: newTokens.get("access_token")!,
            refreshToken: newTokens.get("refresh_token") ?? token.refreshToken,
            expiresIn: newTokens.get("expires_in")!,
          };
        } catch (err) {
          console.error("Error refreshing access_token", err);
          token.error = "RefreshTokenError";
          return token;
        }
      }
    },
    session({ session, token }) {
      return {
        ...session,
        error: token.error,
        user: {
          ...session.user,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
        },
      };
    },
  },
});
