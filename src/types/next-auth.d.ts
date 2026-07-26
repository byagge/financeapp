import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    locale?: string;
    role?: string;
  }
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      locale?: string;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    locale?: string;
    role?: string;
  }
}
