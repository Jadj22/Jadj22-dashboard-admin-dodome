'use client';

import { useBusiness } from '@/hooks/use-business';
import { catalogApi, stockApi, type Item } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function StockClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ item_id: '', type: 'ENTREE' as const, quantite: 1, motif: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!active) return;
    setLoading(true);
    Promise.all([stockApi.list(active.id).then((r) => r.results), catalogApi.items(active.id, { limit: 50 }).then((r) => r.results)])
      .then(([stock, its]) => {
        setRows(stock);
        setItems(its);
        if (its[0] && !form.item_id) setForm((f) => ({ ...f, item_id: its[0].id }));
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [active?.id]);

  const submit = async () => {
    if (!active || !form.item_id || !form.motif) return;
    setSubmitting(true);
    try {
      await stockApi.create(active.id, form);
      setForm((f) => ({ ...f, quantite: 1, motif: '' }));
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!active) return <p className='text-sm text-muted-foreground'>Sélectionnez un business via le switcher.</p>;
  if (loading) return <p className='text-sm'>Chargement stock...</p>;

  return (
    <div className='space-y-6'>
      {error && <p className='text-sm text-destructive'>Erreur: {error}</p>}
      <div className='rounded-md border p-4 space-y-3'>
        <h3 className='font-medium text-sm'>Nouveau mouvement</h3>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
          <div className='space-y-1'>
            <Label>Article</Label>
            <Select value={form.item_id} onValueChange={(v) => setForm({ ...form, item_id: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{items.map((it) => <SelectItem key={it.id} value={it.id}>{it.nom}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value='ENTREE'>ENTRÉE</SelectItem>
                <SelectItem value='SORTIE'>SORTIE</SelectItem>
                <SelectItem value='RETOUR'>RETOUR</SelectItem>
                <SelectItem value='PERTE'>PERTE</SelectItem>
                <SelectItem value='DOMMAGE'>DOMMAGE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label>Quantité</Label>
            <Input type='number' min={1} value={form.quantite} onChange={(e) => setForm({ ...form, quantite: parseInt(e.target.value) || 1 })} />
          </div>
          <div className='space-y-1'>
            <Label>Motif</Label>
            <Input value={form.motif} onChange={(e) => setForm({ ...form, motif: e.target.value })} placeholder='Inventaire initial' />
          </div>
        </div>
        <Button onClick={submit} disabled={submitting || !form.motif} size='sm'>{submitting ? 'Envoi...' : 'Créer mouvement'}</Button>
      </div>

      <div className='rounded-md border'>
        <div className='p-4 text-sm font-medium'>Mouvements ({rows.length})</div>
        <div className='divide-y'>
          {rows.slice(0, 20).map((r: any) => (
            <div key={r.id} className='flex justify-between p-3 text-sm'>
              <span>{r.item_nom ?? r.item_id}</span>
              <span className='font-mono'>{r.type} ×{r.quantite}</span>
              <span className='text-muted-foreground'>{r.acteur?.email ?? '-'}</span>
            </div>
          ))}
          {!rows.length && <p className='p-3 text-sm text-muted-foreground'>Aucun mouvement.</p>}
        </div>
      </div>
    </div>
  );
}
