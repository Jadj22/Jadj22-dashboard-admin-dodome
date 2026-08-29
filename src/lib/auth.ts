import NextAuth from 'next-auth';
import authConfig from './auth.config';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export const { auth, handlers, signOut, signIn } = NextAuth({
  ...authConfig,
  callbacks: {
    async jwt({ token, user, account }) {
      // Credentials -> déjà accessToken sur user (auth.config)
      // @ts-expect-error
      if (user?.accessToken) token.accessToken = user.accessToken;
      // @ts-expect-error
      if (user?.refreshToken) token.refreshToken = user.refreshToken;

      // Google OAuth -> échanger id_token contre JWT DODOME
      // @ts-expect-error
      if (account?.provider === 'google' && account?.id_token) {
        try {
          const res = await fetch(`${API_BASE}/auth/google/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: account.id_token }),
          });
          if (res.ok) {
            const data = (await res.json()) as { access: string; refresh: string; user: any };
            token.accessToken = data.access;
            token.refreshToken = data.refresh;
            // @ts-expect-error
            token.user = data.user;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      // @ts-expect-error
      session.accessToken = token.accessToken;
      // @ts-expect-error
      session.refreshToken = token.refreshToken;
      // @ts-expect-error
      if (token.user) session.user = { ...session.user, ...token.user };
      return session;
    },
  },
});
