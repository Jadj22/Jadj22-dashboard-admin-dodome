'use client';

import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { useBusiness } from '@/hooks/use-business';
import { stockApi, type StockMovement } from '@/lib/dodome-api';
import { useEffect, useState, useMemo } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  entrees: {
    label: 'Entrées',
    color: 'var(--chart-1)'
  },
  sorties: {
    label: 'Sorties',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

export function AreaGraph() {
  const { active } = useBusiness();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active?.id) return;
    setLoading(true);
    stockApi
      .movements(active.id, { page: 1 })
      .then((res) => setMovements(res.results || []))
      .catch(() => setMovements([]))
      .finally(() => setLoading(false));
  }, [active?.id]);

  const chartData = useMemo(() => {
    if (!movements.length) {
      return [
        { date: 'J-5', entrees: 0, sorties: 0 },
        { date: 'J-4', entrees: 0, sorties: 0 },
        { date: 'J-3', entrees: 0, sorties: 0 },
        { date: 'J-2', entrees: 0, sorties: 0 },
        { date: 'J-1', entrees: 0, sorties: 0 },
        { date: "Aujourd'hui", entrees: 0, sorties: 0 }
      ];
    }

    // Group by day
    const groups: Record<string, { entrees: number; sorties: number }> = {};
    movements.forEach((m) => {
      const d = new Date(m.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      if (!groups[d]) groups[d] = { entrees: 0, sorties: 0 };
      if (m.type === 'ENTREE' || m.type === 'RETOUR') {
        groups[d].entrees += m.quantite;
      } else {
        groups[d].sorties += m.quantite;
      }
    });

    return Object.entries(groups).map(([date, val]) => ({
      date,
      entrees: val.entrees,
      sorties: val.sorties
    }));
  }, [movements]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flux de Stock</CardTitle>
        <CardDescription>Entrées vs Sorties récentes</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className='text-muted-foreground py-10 text-center text-sm'>
            Chargement mouvements...
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='aspect-auto h-[310px] w-full'
          >
            <AreaChart
              accessibilityLayer
              data={chartData}
              margin={{
                left: 12,
                right: 12
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey='date'
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator='dot' />}
              />
              <Area
                dataKey='entrees'
                type='natural'
                fill='var(--chart-1)'
                fillOpacity={0.4}
                stroke='var(--chart-1)'
                stackId='a'
              />
              <Area
                dataKey='sorties'
                type='natural'
                fill='var(--chart-2)'
                fillOpacity={0.4}
                stroke='var(--chart-2)'
                stackId='a'
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter>
        <div className='flex w-full items-start gap-2 text-sm'>
          <div className='grid gap-2'>
            <div className='text-muted-foreground flex items-center gap-2 leading-none'>
              {movements.length} mouvement(s) de stock récents analysés
            </div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
