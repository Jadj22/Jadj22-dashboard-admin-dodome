'use client';

import { useBusiness } from '@/hooks/use-business';
import { analyticsApi } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OverviewReal() {
  const { active } = useBusiness();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    analyticsApi
      .dashboard(active.id)
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [active?.id]);

  if (!active) return <p className='text-sm text-muted-foreground'>Sélectionnez un business.</p>;
  if (loading) return <p className='text-sm'>Chargement dashboard...</p>;
  if (error) return <p className='text-sm text-destructive'>Erreur: {error}</p>;
  if (!data) return null;

  const stats = [
    { title: 'Items', value: data.total_items ?? data.items_count ?? '-' },
    { title: 'Réservations', value: data.total_reservations ?? '-' },
    { title: 'Membres', value: data.total_members ?? '-' },
    { title: 'Stock mouvements', value: data.total_movements ?? '-' },
  ];

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {stats.map((s) => (
        <Card key={s.title}>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>{s.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{String(s.value)}</div>
            <p className='text-xs text-muted-foreground'>Données réelles DODOME</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
