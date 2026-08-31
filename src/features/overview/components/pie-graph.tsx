'use client';

import * as React from 'react';
import { Label, Pie, PieChart, Cell } from 'recharts';
import { useBusiness } from '@/hooks/use-business';
import { catalogApi, type Category } from '@/lib/dodome-api';

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

const COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  '#8884d8',
  '#82ca9d'
];

export function PieGraph() {
  const { active } = useBusiness();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!active?.id) return;
    setLoading(true);
    catalogApi
      .categories(active.id)
      .then((res) => setCategories(res || []))
      .catch(() => setCategories([]))
      .finally(() => setLoading(false));
  }, [active?.id]);

  const chartData = React.useMemo(() => {
    if (!categories.length) {
      return [{ category: 'Aucune', count: 1, fill: 'var(--chart-1)' }];
    }
    return categories.map((c, i) => ({
      category: c.nom,
      count: c.item_count || 1,
      fill: COLORS[i % COLORS.length]
    }));
  }, [categories]);

  const chartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {
      count: { label: 'Articles' }
    };
    categories.forEach((c, i) => {
      cfg[c.nom] = {
        label: c.nom,
        color: COLORS[i % COLORS.length]
      };
    });
    return cfg;
  }, [categories]);

  const totalItems = React.useMemo(() => {
    return categories.reduce((acc, curr) => acc + (curr.item_count || 0), 0);
  }, [categories]);

  return (
    <Card className='flex flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>Répartition par Catégorie</CardTitle>
        <CardDescription>Articles du catalogue</CardDescription>
      </CardHeader>
      <CardContent className='flex-1 pb-0'>
        {loading ? (
          <p className='text-muted-foreground py-8 text-center text-sm'>
            Chargement...
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className='mx-auto aspect-square max-h-[360px]'
          >
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey='count'
                nameKey='category'
                innerRadius={60}
                strokeWidth={5}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor='middle'
                          dominantBaseline='middle'
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className='fill-foreground text-3xl font-bold'
                          >
                            {totalItems.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className='fill-muted-foreground'
                          >
                            Articles
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ChartContainer>
        )}
      </CardContent>
      <CardFooter className='flex-col gap-2 text-sm'>
        <div className='text-muted-foreground leading-none'>
          {categories.length} catégorie(s) configurée(s)
        </div>
      </CardFooter>
    </Card>
  );
}
