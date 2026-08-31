'use client';

import GoogleSignInButton from './google-auth-button';

export default function UserAuthForm() {
  return (
    <div className='w-full space-y-4'>
      <GoogleSignInButton />
    </div>
  );
}
