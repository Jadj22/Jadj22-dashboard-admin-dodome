import NextAuth from 'next-auth';
import authConfig from './auth.config';

function getApiBase(): string {
  const raw = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    'http://localhost:8000/api'
  )
    .trim()
    .replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

export const { auth, handlers, signOut, signIn } = NextAuth({
  ...authConfig,

  callbacks: {
    async signIn({ account }) {
      // Seul Google est géré ici. Les credentials passent par le backend directement.
      if (account?.provider !== 'google') return true;
      // On laisse NextAuth créer la session — l'échange id_token → JWT Django
      // se fait dans le callback jwt (ci-dessous).
      return true;
    },

    async jwt({ token, account }) {
      // ───────────────────────────────────────────────────────────────
      // Première connexion Google : échanger l'ID token Google contre
      // des JWT Django via POST /api/auth/google/.
      // Cela garantit que le même User Django est réutilisé, qu'on
      // vienne du mobile (Flutter) ou du Web.
      // ───────────────────────────────────────────────────────────────
      if (account?.provider === 'google' && account.id_token) {
        try {
          const apiBase = getApiBase();
          const res = await fetch(`${apiBase}/auth/google/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: account.id_token })
          });

          if (res.ok) {
            const data = await res.json();
            // Stocker les JWT Django (pas les tokens Google !)
            token.accessToken = data.access;
            token.refreshToken = data.refresh;
            token.backendUserId = String(data.user?.id ?? '');
            console.log('🔐 AUTH: Google → Django JWT exchange OK', {
              backendUserId: token.backendUserId,
              accessTokenPresent: !!data.access
              // Ne JAMAIS logger le token complet.
            });
          } else {
            const text = await res.text().catch(() => '');
            console.error(
              `🔐 AUTH: Google → Django JWT exchange FAILED (${apiBase}/auth/google/)`,
              res.status,
              text.slice(0, 200)
            );
          }
        } catch (error) {
          console.error('🔐 AUTH: Google → Django JWT exchange ERROR', error);
        }
      }

      // ───────────────────────────────────────────────────────────────
      // PAS de rôle/permissions stockés dans le JWT.
      // Le rôle dépend du business courant et est résolu côté client
      // via GET /api/businesses/current/context/ + X-Business-ID.
      // ───────────────────────────────────────────────────────────────

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;

      if (session.user) {
        session.user.backendUserId = token.backendUserId as string;
      }

      return session;
    }
  }
});
