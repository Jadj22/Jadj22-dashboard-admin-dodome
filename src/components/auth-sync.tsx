'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function AuthSync() {
  const { data: session, status } = useSession();
  useEffect(() => {
    if (status === 'loading' || !session) return;
    const access = session.accessToken as string | undefined;
    const refresh = session.refreshToken as string | undefined;
    if (access) localStorage.setItem('dodome_access', access);
    if (refresh) localStorage.setItem('dodome_refresh', refresh);
  }, [session]);
  return null;
}
