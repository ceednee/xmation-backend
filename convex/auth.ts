import { convexAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [
    // X OAuth provider configuration
    // Using generic OAuth2 config since @auth/core X provider isn't available
    {
      id: "x",
      name: "X (Twitter)",
      type: "oauth",
      clientId: process.env.X_CLIENT_ID!,
      clientSecret: process.env.X_CLIENT_SECRET!,
      authorization: {
        url: "https://twitter.com/i/oauth2/authorize",
        params: {
          scope: "tweet.read tweet.write users.read follows.read follows.write dm.read dm.write offline.access",
        },
      },
      token: "https://api.twitter.com/2/oauth2/token",
      userinfo: "https://api.twitter.com/2/users/me",
      profile(profile: any) {
        return {
          id: profile.data.id,
          name: profile.data.name,
          email: null, // X doesn't provide email by default
          image: profile.data.profile_image_url,
          xUsername: profile.data.username,
        };
      },
    },
  ],
  callbacks: {
    async session({ session, user }) {
      // Add X connection status to session
      return {
        ...session,
        user: {
          ...session.user,
          id: user.id,
          // X data will be fetched separately
        },
      };
    },
  },
});
