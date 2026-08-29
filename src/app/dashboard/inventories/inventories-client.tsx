'use client';

import { useBusiness } from '@/hooks/use-business';
import { inventoryApi } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function InventoriesClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [libelle, setLibelle] = useState('');

  const load = () => {
    if (!active) return;
    setLoading(true);
    inventoryApi.list(active.id).then(setRows).catch((e) => setError((e as Error).message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [active?.id]);

  const create = async () => {
    if (!active || !libelle) return;
    await inventoryApi.create(active.id, { libelle });
    setLibelle('');
    load();
  };
  const cloturer = async (id: string) => { if (!active) return; await inventoryApi.cloture(active.id, id); load(); };

  if (!active) return <p className='text-sm text-muted-foreground'>Sélectionnez un business.</p>;

  return (
    <div className='space-y-4'>
      {error && <p className='text-sm text-destructive'>{error}</p>}
      <div className='flex gap-2'>
        <Input placeholder='Libellé inventaire' value={libelle} onChange={(e) => setLibelle(e.target.value)} className='max-w-sm' />
        <Button onClick={create} disabled={!libelle}>Créer inventaire</Button>
      </div>
      {loading ? <p className='text-sm'>Chargement...</p> : (
        <div className='rounded-md border divide-y'>
          {rows.map((r: any) => (
            <div key={r.id} className='flex justify-between p-3 text-sm items-center'>
              <span>{r.libelle} <span className='text-muted-foreground'>({r.statut}) {r.avancement?.pourcentage ?? ''}%</span></span>
              {r.statut === 'EN_COURS' && <Button size='sm' variant='outline' onClick={() => cloturer(r.id)}>Clôturer</Button>}
            </div>
          ))}
          {!rows.length && <p className='p-3 text-sm text-muted-foreground'>Aucun inventaire.</p>}
        </div>
      )}
    </div>
  );
}
