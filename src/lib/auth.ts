import NextAuth from 'next-auth';
import authConfig from './auth.config';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

export const { auth, handlers, signOut, signIn } = NextAuth({
  ...authConfig,

  callbacks: {
    async jwt({ token, user, account }) {
      // Première connexion classique
      if (user?.accessToken) {
        token.accessToken = user.accessToken;
      }

      if (user?.refreshToken) {
        token.refreshToken = user.refreshToken;
      }

      // Connexion Google
      if (account?.provider === 'google') {
        if (account.access_token) {
          token.accessToken = account.access_token;
        }

        if (account.refresh_token) {
          token.refreshToken = account.refresh_token;
        }
      }

      // Récupération des informations utilisateur depuis le backend
      if (token.accessToken) {
        try {
          const res = await fetch(`${API_BASE}/auth/me/`, {
            headers: {
              Authorization: `Bearer ${token.accessToken}`
            }
          });

          if (res.ok) {
            const data = await res.json();

            token.role = data.role;
            token.permissions = data.permissions;
          }
        } catch (error) {
          console.error('Erreur récupération utilisateur:', error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;

      if (session.user) {
        session.user.role = token.role as string;
        session.user.permissions = token.permissions as string[];
      }

      return session;
    }
  }
});
