'use client';

import * as React from 'react';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import { useBusiness } from '@/hooks/use-business';
import { catalogApi, type Item } from '@/lib/dodome-api';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';

const chartConfig = {
  prix: {
    label: 'Prix unitaire (FCFA)',
    color: 'var(--chart-1)'
  }
} satisfies ChartConfig;

export function BarGraph() {
  const { active } = useBusiness();
  const [items, setItems] = React.useState<Item[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!active?.id) return;
    setLoading(true);
    catalogApi
      .items(active.id, { limit: 10 })
      .then((res) => setItems(res.results || []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [active?.id]);

  const chartData = React.useMemo(() => {
    return items.map((it) => ({
      nom: it.nom.length > 12 ? `${it.nom.slice(0, 12)}…` : it.nom,
      prix: parseFloat(it.prix) || 0
    }));
  }, [items]);

  return (
    <Card>
      <CardHeader className='flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row'>
        <div className='flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6'>
          <CardTitle>Articles & Tarification</CardTitle>
          <CardDescription>
            Aperçu des prix unitaires des articles du catalogue
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='px-2 sm:p-6'>
        {loading ? (
          <p className='text-muted-foreground py-12 text-center text-sm'>
            Chargement catalogue...
          </p>
        ) : chartData.length === 0 ? (
          <p className='text-muted-foreground py-12 text-center text-sm'>
            Aucun article dans le catalogue.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-[280px] w-full'
          >
            <BarChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='nom'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent className='w-[150px]' nameKey='prix' />
                }
              />
              <Bar dataKey='prix' fill='var(--chart-1)' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
