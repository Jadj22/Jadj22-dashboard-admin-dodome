import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import CategoriesClient from './categories-client';

export const metadata = { title: 'Dashboard: Catégories' };

export default function Page() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading title='Catégories' description='Gérez le catalogue (US-05) — parent, image Cloudinary' />
        <Separator />
        <CategoriesClient />
      </div>
    </PageContainer>
  );
}
