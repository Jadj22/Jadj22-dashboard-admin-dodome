'use client';

import { useBusiness } from '@/hooks/use-business';
import { bookingRequestApi, apiCache } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function BookingRequestsClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('');
  const [motif, setMotif] = useState('Indisponible');

  const load = () => {
    if (!active) return;
    setLoading(true);
    bookingRequestApi
      .list(active.id, { statut: filter || undefined })
      .then((d) => setRows(d.results || []))
      .catch((e) => setError((e as Error).message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    load();
  }, [active?.id, filter]);

  const handleRefresh = () => {
    setRefreshing(true);
    apiCache.invalidate('reservations');
    load();
    toast.success('Demandes de devis actualisées');
  };

  const act = async (
    r: any,
    action: 'accepter' | 'refuser' | 'contre_proposer'
  ) => {
    if (!active) return;
    try {
      await bookingRequestApi.action(
        active.id,
        r.id,
        action,
        action === 'refuser' ? { motif_refus: motif } : undefined
      );
      toast.success(`Demande traitée (${action})`);
      load();
    } catch (e) {
      setError((e as Error).message);
      toast.error('Erreur lors du traitement de la demande');
    }
  };

  if (!active)
    return (
      <p className='text-muted-foreground text-sm'>Sélectionnez un business.</p>
    );

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap gap-2'>
          <Button
            variant={filter === '' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setFilter('')}
          >
            Toutes
          </Button>
          <Button
            variant={filter === 'EN_ATTENTE' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setFilter('EN_ATTENTE')}
          >
            En attente
          </Button>
          <Button
            variant={filter === 'ACCEPTEE' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setFilter('ACCEPTEE')}
          >
            Acceptée
          </Button>
        </div>

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

      <div className='flex items-center gap-2'>
        <Input
          placeholder='Motif de refus par défaut'
          value={motif}
          onChange={(e) => setMotif(e.target.value)}
          className='max-w-xs'
        />
      </div>

      {error && <p className='text-destructive text-sm'>Erreur: {error}</p>}
      {loading ? (
        <p className='text-muted-foreground text-sm'>
          Chargement des demandes...
        </p>
      ) : !rows.length ? (
        <p className='text-muted-foreground rounded-lg border p-8 text-center text-sm'>
          Aucune demande de réservation trouvée.
        </p>
      ) : (
        <div className='bg-card divide-y rounded-lg border'>
          {rows.slice(0, 30).map((r: any) => (
            <div
              key={r.id}
              className='flex flex-col items-start justify-between gap-3 p-4 sm:flex-row sm:items-center'
            >
              <div>
                <p className='text-sm font-medium'>
                  {r.client_nom || r.contact_nom || 'Client'}{' '}
                  <span className='text-muted-foreground text-xs font-normal'>
                    ({r.statut})
                  </span>
                </p>
                <p className='text-muted-foreground text-xs'>
                  Période : {r.date_debut} → {r.date_fin}
                </p>
                {r.message && (
                  <p className='text-foreground/80 mt-1 text-xs'>
                    « {r.message} »
                  </p>
                )}
              </div>
              <div className='flex shrink-0 gap-2'>
                {r.statut === 'EN_ATTENTE' && (
                  <>
                    <Button size='sm' onClick={() => act(r, 'accepter')}>
                      Accepter
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => act(r, 'refuser')}
                    >
                      Refuser
                    </Button>
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
