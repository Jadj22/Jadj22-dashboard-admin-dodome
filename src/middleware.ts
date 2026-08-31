// Protecting routes with next-auth
// https://next-auth.js.org/configuration/nextjs#middleware
// https://nextjs.org/docs/app/building-your-application/routing/middleware

import { auth } from '@/lib/auth';

export default auth((req) => {
  if (!req.auth) {
    return Response.redirect(new URL('/', req.url));
  }
});

export const config = {
  matcher: ['/dashboard/:path*']
};
