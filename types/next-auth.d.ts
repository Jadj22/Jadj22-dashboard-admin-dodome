import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: DefaultSession['user'] & {
      role?: string;
      permissions?: string[];
      businessId?: string;
    };
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    permissions?: string[];
    businessId?: string;
  }

  interface CredentialsInputs {
    email: string;
    password: string;
  }
}
