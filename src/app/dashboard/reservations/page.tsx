import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import ReservationsClient from './reservations-client';

export const metadata = { title: 'Dashboard: Réservations' };

export default function Page() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading title='Réservations' description='VALIDEE → EN_COURS (SORTIE) → TERMINEE (RETOUR)' />
        <Separator />
        <ReservationsClient />
      </div>
    </PageContainer>
  );
}
