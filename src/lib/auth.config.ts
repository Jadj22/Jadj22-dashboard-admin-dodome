import { NextAuthConfig } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

const authConfig = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID ?? '',
      clientSecret: process.env.AUTH_GOOGLE_SECRET ?? '',
      authorization: { params: { scope: 'openid email profile' } }
    })
  ],
  pages: {
    signIn: '/' // signin page
  }
} satisfies NextAuthConfig;

export default authConfig;
