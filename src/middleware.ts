import NextAuth from 'next-auth';
import authConfig from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const isAuthenticated = !!req.auth;

  console.log('🔐 PROXY:', {
    pathname: req.nextUrl.pathname,
    authenticated: isAuthenticated,
    user: req.auth?.user
      ? {
          name: req.auth.user.name,
          email: req.auth.user.email
          // Ne JAMAIS logger accessToken, refreshToken ou image complète.
        }
      : null
  });

  // Si non authentifié sur /dashboard, rediriger vers la page de connexion.
  if (!isAuthenticated) {
    const signInUrl = new URL('/', req.nextUrl.origin);
    return Response.redirect(signInUrl);
  }

  // Pas de vérification de rôle ici :
  // le rôle dépend du business courant et est résolu côté client
  // via BusinessProvider → GET /api/businesses/current/context/.
  // Les permissions métier sont validées côté backend.
});

export const config = {
  matcher: ['/dashboard/:path*']
};
