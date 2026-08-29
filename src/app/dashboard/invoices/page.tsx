import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import InvoicesClient from './invoices-client';

export const metadata = { title: 'Dashboard: Facturation' };

export default function Page() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading title='Facturation' description='Devis / Factures, envoi et paiement' />
        <Separator />
        <InvoicesClient />
      </div>
    </PageContainer>
  );
}
