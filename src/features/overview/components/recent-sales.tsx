'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { useBusiness } from '@/hooks/use-business';
import { reservationApi, type Reservation } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';

export function RecentSales() {
  const { active } = useBusiness();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!active?.id) return;
    setLoading(true);
    reservationApi
      .list(active.id, { limit: 5 })
      .then((res) => setReservations(res.results || []))
      .catch(() => setReservations([]))
      .finally(() => setLoading(false));
  }, [active?.id]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Réservations récentes</CardTitle>
        <CardDescription>
          {reservations.length > 0
            ? `${reservations.length} réservation(s) récentes pour ce business.`
            : 'Aucune réservation récente.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className='text-muted-foreground text-sm'>Chargement...</p>
        ) : reservations.length === 0 ? (
          <p className='text-muted-foreground text-sm'>
            Aucune réservation enregistrée.
          </p>
        ) : (
          <div className='space-y-6'>
            {reservations.map((r) => {
              const initials = (r.item_nom || 'Item').slice(0, 2).toUpperCase();
              return (
                <div key={r.id} className='flex items-center'>
                  <Avatar className='h-9 w-9'>
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className='ml-4 space-y-1'>
                    <p className='text-sm leading-none font-medium'>
                      {r.item_nom}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      Du {new Date(r.date_debut).toLocaleDateString()} au{' '}
                      {new Date(r.date_fin).toLocaleDateString()}
                    </p>
                  </div>
                  <div className='bg-muted ml-auto rounded px-2 py-1 text-xs font-medium'>
                    {r.statut} (x{r.quantite})
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
