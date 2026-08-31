import NextAuth, { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    user: DefaultSession['user'] & {
      /** Django User.id (int as string). */
      backendUserId?: string;
    };
  }

  interface User {
    accessToken?: string;
    refreshToken?: string;
    backendUserId?: string;
  }

  interface CredentialsInputs {
    email: string;
    password: string;
  }
}
