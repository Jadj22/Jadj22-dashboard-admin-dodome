import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service - DODOME',
  description: 'Terms of service for DODOME platform'
};

export default function TermsPage() {
  return (
    <div className='bg-background min-h-screen p-8'>
      <div className='mx-auto max-w-4xl'>
        <h1 className='mb-6 text-3xl font-bold'>Terms of Service</h1>

        <p>Last updated: August 2026</p>

        <div className='prose max-w-none'>
          <h2 className='mb-4 text-2xl font-bold'>Acceptance</h2>
          <p>
            By accessing our website and/or using our service, you accept our
            terms.
          </p>

          <h2 className='mt-8 mb-4 text-2xl font-bold'>User Conduct</h2>
          <p>You agree to use our service only for lawful purposes.</p>

          <h2 className='mt-8 mb-4 text-2xl font-bold'>Termination</h2>
          <p>
            We may terminate or suspend your account for breach of these terms.
          </p>

          <h2 className='mt-8 mb-4 text-2xl font-bold'>Changes</h2>
          <p>We reserve the right to modify these terms at any time.</p>
        </div>
      </div>
    </div>
  );
}
