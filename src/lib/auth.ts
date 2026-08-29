import NextAuth from 'next-auth';
import authConfig from './auth.config';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export const { auth, handlers, signOut, signIn } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, user, account }) {
      if (user?.accessToken) token.accessToken = user.accessToken as string;
      if (user?.refreshToken) token.refreshToken = user.refreshToken as string;

      if (account?.provider === 'google' && account?.id_token) {
        try {
          const res = await fetch(`${API_BASE}/auth/google/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: account.id_token })
          });
          if (res.ok) {
            const data = (await res.json()) as {
              access: string;
              refresh: string;
              user: any;
            };
            token.accessToken = data.access;
            token.refreshToken = data.refresh;
            token.user = data.user;
          }
        } catch {}
      }

      if (token.accessToken) {
        const businessId = token.businessId as string | undefined;
        // Fetch user role from API
        try {
          const res = await fetch(`${API_BASE}/auth/me/`, {
            headers: { Authorization: `Bearer ${token.accessToken}` }
          });
          if (res.ok) {
            const data = (await res.json()) as {
              role?: string;
              permissions?: string[];
            };
            token.role = data.role;
            token.permissions = data.permissions;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      if (token.user) session.user = { ...session.user, ...token.user };
      session.user.role = token.role as string;
      session.user.permissions = token.permissions as string[];
      return session;
    }
  }
});
