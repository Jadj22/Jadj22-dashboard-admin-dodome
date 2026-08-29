'use client';

import { useBusiness } from '@/hooks/use-business';
import { bookingRequestApi } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function BookingRequestsClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [motif, setMotif] = useState('Indisponible');

  const load = () => {
    if (!active) return;
    setLoading(true);
    bookingRequestApi
      .list(active.id, { statut: filter || undefined })
      .then((d) => setRows(d.results))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [active?.id, filter]);

  const act = async (r: any, action: 'accepter' | 'refuser' | 'contre_proposer') => {
    if (!active) return;
    try {
      await bookingRequestApi.action(active.id, r.id, action, action === 'refuser' ? { motif_refus: motif } : undefined);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!active) return <p className='text-sm text-muted-foreground'>Sélectionnez un business.</p>;

  return (
    <div className='space-y-4'>
      <div className='flex gap-2'>
        <Button variant={filter === '' ? 'default' : 'outline'} size='sm' onClick={() => setFilter('')}>Toutes</Button>
        <Button variant={filter === 'EN_ATTENTE' ? 'default' : 'outline'} size='sm' onClick={() => setFilter('EN_ATTENTE')}>EN_ATTENTE</Button>
        <Button variant={filter === 'ACCEPTEE' ? 'default' : 'outline'} size='sm' onClick={() => setFilter('ACCEPTEE')}>ACCEPTÉE</Button>
      </div>
      <div className='flex gap-2 items-center'>
        <Input placeholder='Motif refus' value={motif} onChange={(e) => setMotif(e.target.value)} className='max-w-xs' />
      </div>
      {error && <p className='text-sm text-destructive'>Erreur: {error}</p>}
      {loading ? (
        <p className='text-sm'>Chargement...</p>
      ) : !rows.length ? (
        <p className='text-sm text-muted-foreground'>Aucune demande.</p>
      ) : (
        <div className='rounded-md border divide-y'>
          {rows.slice(0, 20).map((r: any) => (
            <div key={r.id} className='flex flex-col gap-2 p-3 text-sm md:flex-row md:items-center md:justify-between'>
              <span>{r.client_nom} ({r.client_email}) — {r.item_nom} ×{r.quantite} {r.date_debut}→{r.date_fin}</span>
              <div className='flex gap-1 items-center'>
                <span className='rounded-full bg-muted px-2 py-0.5 text-xs'>{r.statut}</span>
                {r.statut === 'EN_ATTENTE' && (
                  <>
                    <Button size='sm' onClick={() => act(r, 'accepter')}>Accepter</Button>
                    <Button size='sm' variant='destructive' onClick={() => act(r, 'refuser')}>Refuser</Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
