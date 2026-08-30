import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy - DODOME',
  description: 'Privacy policy for DODOME platform'
};

export default function PrivacyPage() {
  return (
    <div className='bg-background min-h-screen p-8'>
      <div className='mx-auto max-w-4xl'>
        <h1 className='mb-6 text-3xl font-bold'>Privacy Policy</h1>

        <p className='mb-8'>Last updated: August 2026</p>

        <div className='prose max-w-none'>
          <h2 className='mb-4 text-2xl font-bold'>Information Collection</h2>

          <p>
            We collect information you provide directly to us, such as when you
            create an account or make a request.
          </p>

          <h2 className='mt-8 mb-4 text-2xl font-bold'>Information Use</h2>

          <p>
            We use the information we collect to operate, maintain, and provide
            our service.
          </p>

          <h2 className='mt-8 mb-4 text-2xl font-bold'>Information Sharing</h2>

          <p>
            We may share your information with service providers who support us
            in operating our website and business.
          </p>

          <h2 className='mt-8 mb-4 text-2xl font-bold'>Your Choices</h2>

          <p>
            You can opt-out of certain collections or uses of your information.
          </p>
        </div>
      </div>
    </div>
  );
}
