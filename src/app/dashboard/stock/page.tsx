import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import StockClient from './stock-client';

export const metadata = { title: 'Dashboard: Stock' };

export default function Page() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading title='Stock' description='Mouvements ENTREE/SORTIE/RETOUR (temps réel)' />
        <Separator />
        <StockClient />
      </div>
    </PageContainer>
  );
}
