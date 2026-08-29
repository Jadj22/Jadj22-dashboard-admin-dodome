'use client';

import { useBusiness } from '@/hooks/use-business';
import { invoiceApi } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

export default function InvoicesClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!active) return;
    setLoading(true);
    invoiceApi.list(active.id).then(setRows).catch((e) => setError((e as Error).message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [active?.id]);

  const markSent = async (id: string) => { if (!active) return; await invoiceApi.markSent(active.id, id); load(); };
  const markPaid = async (id: string) => { if (!active) return; await invoiceApi.markPaid(active.id, id); load(); };

  if (!active) return <p className='text-sm text-muted-foreground'>Sélectionnez un business.</p>;
  if (loading) return <p className='text-sm'>Chargement...</p>;

  return (
    <div className='space-y-4'>
      {error && <p className='text-sm text-destructive'>{error}</p>}
      <div className='rounded-md border divide-y'>
        {rows.map((r: any) => (
          <div key={r.id} className='flex justify-between p-3 text-sm items-center'>
            <span>{r.numero} — {r.client_nom} {r.total_ttc}€ <span className='text-muted-foreground'>({r.statut})</span></span>
            <div className='flex gap-1'>
              {r.statut === 'BROUILLON' && <Button size='sm' variant='outline' onClick={() => markSent(r.id)}>Envoyer</Button>}
              {r.statut === 'ENVOYEE' && <Button size='sm' onClick={() => markPaid(r.id)}>Marquer payée</Button>}
            </div>
          </div>
        ))}
        {!rows.length && <p className='p-3 text-sm text-muted-foreground'>Aucune facture.</p>}
      </div>
    </div>
  );
}
