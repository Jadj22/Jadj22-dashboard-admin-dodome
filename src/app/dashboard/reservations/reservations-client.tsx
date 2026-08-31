'use client';

import { useBusiness } from '@/hooks/use-business';
import { reservationApi, apiCache } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const STATUTS = [
  'EN_ATTENTE',
  'VALIDEE',
  'EN_COURS',
  'TERMINEE',
  'ANNULEE'
] as const;

export default function ReservationsClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('');

  const load = () => {
    if (!active) return;
    setLoading(true);
    reservationApi
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
    toast.success('Réservations actualisées');
  };

  const act = async (
    r: any,
    action: 'valider' | 'annuler' | 'demarrer' | 'terminer'
  ) => {
    if (!active) return;
    try {
      await reservationApi.action(active.id, r.id, action);
      toast.success(`Réservation ${action} avec succès`);
      load();
    } catch (e) {
      setError((e as Error).message);
      toast.error(`Erreur lors de l'action ${action}`);
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
          {STATUTS.map((s) => (
            <Button
              key={s}
              variant={filter === s ? 'default' : 'outline'}
              size='sm'
              onClick={() => setFilter(s)}
            >
              {s}
            </Button>
          ))}
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

      {error && <p className='text-destructive text-sm'>Erreur: {error}</p>}
      {loading ? (
        <p className='text-muted-foreground text-sm'>
          Chargement des réservations...
        </p>
      ) : !rows.length ? (
        <p className='text-muted-foreground rounded-lg border p-8 text-center text-sm'>
          Aucune réservation trouvée.
        </p>
      ) : (
        <div className='grid gap-3 md:grid-cols-2'>
          {rows.slice(0, 30).map((r: any) => (
            <div key={r.id} className='bg-card space-y-2 rounded-lg border p-4'>
              <div className='flex items-center justify-between'>
                <span className='text-sm font-semibold'>
                  {r.contact_nom || r.client_nom || 'Client'}
                </span>
                <span className='bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium'>
                  {r.statut}
                </span>
              </div>
              <p className='text-muted-foreground text-xs'>
                Du {new Date(r.date_debut).toLocaleDateString()} au{' '}
                {new Date(r.date_fin).toLocaleDateString()}
              </p>
              {r.items_count !== undefined && (
                <p className='text-muted-foreground font-mono text-xs'>
                  {r.items_count} article(s) réservé(s)
                </p>
              )}
              <div className='flex flex-wrap gap-1.5 pt-2'>
                {r.statut === 'EN_ATTENTE' && (
                  <>
                    <Button size='sm' onClick={() => act(r, 'valider')}>
                      Valider
                    </Button>
                    <Button
                      size='sm'
                      variant='destructive'
                      onClick={() => act(r, 'annuler')}
                    >
                      Annuler
                    </Button>
                  </>
                )}
                {r.statut === 'VALIDEE' && (
                  <Button size='sm' onClick={() => act(r, 'demarrer')}>
                    Démarrer
                  </Button>
                )}
                {r.statut === 'EN_COURS' && (
                  <Button size='sm' onClick={() => act(r, 'terminer')}>
                    Terminer
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
