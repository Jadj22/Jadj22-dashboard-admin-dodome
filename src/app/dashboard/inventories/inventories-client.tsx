'use client';

import { useBusiness } from '@/hooks/use-business';
import { inventoryApi, apiCache } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, ClipboardCheck, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function InventoriesClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libelle, setLibelle] = useState('');

  const load = () => {
    if (!active) return;
    setLoading(true);
    inventoryApi
      .list(active.id)
      .then((d) => setRows(d || []))
      .catch((e) => setError((e as Error).message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    load();
  }, [active?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    apiCache.invalidate('inventories');
    load();
    toast.success('Inventaires actualisés');
  };

  const create = async () => {
    if (!active || !libelle.trim()) return;
    try {
      await inventoryApi.create(active.id, { libelle: libelle.trim() });
      toast.success('Nouvelle campagne d’inventaire créée');
      setLibelle('');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la création');
    }
  };

  const cloturer = async (id: string) => {
    if (!active) return;
    await inventoryApi.cloture(active.id, id);
    toast.success('Inventaire clôturé');
    load();
  };

  if (!active)
    return (
      <p className='text-muted-foreground text-sm'>Sélectionnez un business.</p>
    );

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='flex items-center gap-2 text-lg font-semibold'>
          <ClipboardCheck className='h-5 w-5' /> Campagnes d'Inventaire
        </h3>
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

      {error && <p className='text-destructive text-sm'>{error}</p>}

      <div className='bg-card flex gap-2 rounded-lg border p-4'>
        <Input
          placeholder='Libellé de la campagne (Ex: Inventaire Fin de Mois...)'
          value={libelle}
          onChange={(e) => setLibelle(e.target.value)}
          className='max-w-md'
        />
        <Button onClick={create} disabled={!libelle.trim()} className='gap-1.5'>
          <Plus className='h-4 w-4' /> Créer inventaire
        </Button>
      </div>

      {loading ? (
        <p className='text-muted-foreground text-sm'>
          Chargement des inventaires...
        </p>
      ) : (
        <div className='bg-card divide-y rounded-lg border'>
          {rows.map((r: any) => (
            <div
              key={r.id}
              className='flex items-center justify-between p-4 text-sm'
            >
              <div>
                <p className='font-semibold'>{r.libelle}</p>
                <p className='text-muted-foreground text-xs'>
                  Statut : {r.statut}{' '}
                  {r.avancement?.pourcentage
                    ? `• Avancement : ${r.avancement.pourcentage}%`
                    : ''}
                </p>
              </div>
              {r.statut === 'EN_COURS' && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => cloturer(r.id)}
                >
                  Clôturer la campagne
                </Button>
              )}
            </div>
          ))}
          {!rows.length && (
            <p className='text-muted-foreground p-8 text-center text-sm'>
              Aucun inventaire en cours ou archivé.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
