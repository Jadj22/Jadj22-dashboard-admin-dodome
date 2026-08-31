'use client';

import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AreaGraph } from './area-graph';
import { BarGraph } from './bar-graph';
import { PieGraph } from './pie-graph';
import { RecentSales } from './recent-sales';
import OverviewReal from '@/app/dashboard/overview/overview-real';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { apiCache } from '@/lib/dodome-api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function OverViewPage() {
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const handleRefresh = () => {
    setRefreshing(true);
    apiCache.invalidate();
    router.refresh();
    toast.success('Tableau de bord actualisé');
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <h2 className='text-2xl font-bold tracking-tight'>
            Tableau de bord DODOME 👋
          </h2>

          <Button
            variant='outline'
            size='sm'
            className='gap-1.5'
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
            />
            Actualiser
          </Button>
        </div>

        <Tabs defaultValue='overview' className='space-y-4'>
          <TabsList>
            <TabsTrigger value='overview'>Vue d'ensemble</TabsTrigger>
          </TabsList>
          <TabsContent value='overview' className='space-y-4'>
            {/* Données réelles DODOME */}
            <OverviewReal />
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
              <div className='col-span-4'>
                <BarGraph />
              </div>
              <div className='col-span-4 md:col-span-3'>
                <RecentSales />
              </div>
              <div className='col-span-4'>
                <AreaGraph />
              </div>
              <div className='col-span-4 md:col-span-3'>
                <PieGraph />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
}
