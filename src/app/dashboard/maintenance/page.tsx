import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import MaintenanceClient from './maintenance-client';

export const metadata = { title: 'Dashboard: Entretien' };

export default function Page() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading title='Entretien' description='Procédures, tâches, étapes et contrôles (RM-09/10/11)' />
        <Separator />
        <MaintenanceClient />
      </div>
    </PageContainer>
  );
}
