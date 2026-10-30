import "next-auth";

declare module "next-auth" {
  interface User {
    discordId?: string;
  }

  interface Session {
    user?: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      discordId?: string;
    };
  }
}
