'use client';

import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

export function AuthSync() {
  const { data: session } = useSession();
  useEffect(() => {
    // @ts-expect-error
    const access = (session as any)?.accessToken as string | undefined;
    // @ts-expect-error
    const refresh = (session as any)?.refreshToken as string | undefined;
    if (access) localStorage.setItem('dodome_access', access);
    if (refresh) localStorage.setItem('dodome_refresh', refresh);
  }, [session]);
  return null;
}
