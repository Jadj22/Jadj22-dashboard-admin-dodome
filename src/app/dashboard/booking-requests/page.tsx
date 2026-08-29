import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import BookingRequestsClient from './booking-client';

export const metadata = { title: 'Dashboard: Demandes' };

export default function Page() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading title='Demandes publiques' description='BookingRequests EN_ATTENTE / ACCEPTEE (vitrine)' />
        <Separator />
        <BookingRequestsClient />
      </div>
    </PageContainer>
  );
}
