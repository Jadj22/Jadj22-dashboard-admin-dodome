import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import InventoriesClient from './inventories-client';

export const metadata = { title: 'Dashboard: Inventaires' };

export default function Page() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading title='Inventaires' description='Comptages, écarts et clôture (US-22/23)' />
        <Separator />
        <InventoriesClient />
      </div>
    </PageContainer>
  );
}
