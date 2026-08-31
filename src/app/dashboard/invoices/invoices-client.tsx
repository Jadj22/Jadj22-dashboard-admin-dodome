'use client';

import { useBusiness } from '@/hooks/use-business';
import { invoiceApi, apiCache } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw, Receipt } from 'lucide-react';
import { toast } from 'sonner';

export default function InvoicesClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!active) return;
    setLoading(true);
    invoiceApi
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
    apiCache.invalidate('invoices');
    load();
    toast.success('Factures actualisées');
  };

  const markSent = async (id: string) => {
    if (!active) return;
    await invoiceApi.markSent(active.id, id);
    toast.success('Facture marquée comme envoyée');
    load();
  };

  const markPaid = async (id: string) => {
    if (!active) return;
    await invoiceApi.markPaid(active.id, id);
    toast.success('Facture marquée comme payée');
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
          <Receipt className='h-5 w-5' /> Facturation & Règlements
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

      {error && <p className='text-destructive text-sm'>Erreur: {error}</p>}

      {loading ? (
        <p className='text-muted-foreground text-sm'>
          Chargement des factures...
        </p>
      ) : (
        <div className='bg-card divide-y rounded-lg border'>
          {rows.map((r: any) => (
            <div
              key={r.id}
              className='flex items-center justify-between p-4 text-sm'
            >
              <div>
                <p className='font-semibold'>
                  {r.numero || 'Facture'} — {r.client_nom || 'Client'}
                </p>
                <p className='text-muted-foreground font-mono text-xs'>
                  Total TTC : {r.total_ttc || 0} FCFA
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <span className='bg-muted rounded-full px-2 py-0.5 text-xs font-medium'>
                  {r.statut}
                </span>
                {r.statut === 'BROUILLON' && (
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => markSent(r.id)}
                  >
                    Envoyer
                  </Button>
                )}
                {r.statut === 'ENVOYEE' && (
                  <Button size='sm' onClick={() => markPaid(r.id)}>
                    Marquer payée
                  </Button>
                )}
              </div>
            </div>
          ))}
          {!rows.length && (
            <p className='text-muted-foreground p-8 text-center text-sm'>
              Aucune facture émise pour le moment.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
