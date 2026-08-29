import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import MembersClient from './members-client';

export const metadata = { title: 'Dashboard: Membres' };

export default function Page() {
  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-4'>
        <Heading title='Membres & RBAC' description='Roles OWNER/ADMIN/MEMBER + permissions' />
        <Separator />
        <MembersClient />
      </div>
    </PageContainer>
  );
}
