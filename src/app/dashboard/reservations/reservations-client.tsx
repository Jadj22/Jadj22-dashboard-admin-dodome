'use client';

import { useBusiness } from '@/hooks/use-business';
import { reservationApi } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

const STATUTS = ['EN_ATTENTE', 'VALIDEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'] as const;

export default function ReservationsClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  const load = () => {
    if (!active) return;
    setLoading(true);
    reservationApi
      .list(active.id, { statut: filter || undefined })
      .then((d) => setRows(d.results))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [active?.id, filter]);

  const act = async (r: any, action: 'valider' | 'annuler' | 'demarrer' | 'terminer') => {
    if (!active) return;
    try {
      await reservationApi.action(active.id, r.id, action);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!active) return <p className='text-sm text-muted-foreground'>Sélectionnez un business.</p>;

  return (
    <div className='space-y-4'>
      <div className='flex gap-2 flex-wrap'>
        <Button variant={filter === '' ? 'default' : 'outline'} size='sm' onClick={() => setFilter('')}>Toutes</Button>
        {STATUTS.map((s) => (
          <Button key={s} variant={filter === s ? 'default' : 'outline'} size='sm' onClick={() => setFilter(s)}>{s}</Button>
        ))}
      </div>
      {error && <p className='text-sm text-destructive'>Erreur: {error}</p>}
      {loading ? (
        <p className='text-sm'>Chargement...</p>
      ) : !rows.length ? (
        <p className='text-sm text-muted-foreground'>Aucune réservation.</p>
      ) : (
        <div className='grid gap-3 md:grid-cols-2'>
          {rows.slice(0, 30).map((r: any) => (
            <div key={r.id} className='rounded-md border p-3 space-y-2'>
              <div className='flex justify-between items-center'>
                <span className='font-medium text-sm'>{r.item_nom} ×{r.quantite}</span>
                <span className='rounded-full bg-muted px-2 py-0.5 text-xs'>{r.statut}</span>
              </div>
              <p className='text-xs text-muted-foreground'>{r.date_debut} → {r.date_fin}</p>
              <div className='flex gap-1 flex-wrap'>
                {r.statut === 'EN_ATTENTE' && (
                  <>
                    <Button size='sm' variant='default' onClick={() => act(r, 'valider')}>Valider</Button>
                    <Button size='sm' variant='outline' onClick={() => act(r, 'annuler')}>Annuler</Button>
                  </>
                )}
                {r.statut === 'VALIDEE' && <Button size='sm' onClick={() => act(r, 'demarrer')}>Démarrer (SORTIE)</Button>}
                {r.statut === 'EN_COURS' && <Button size='sm' onClick={() => act(r, 'terminer')}>Terminer (RETOUR)</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
