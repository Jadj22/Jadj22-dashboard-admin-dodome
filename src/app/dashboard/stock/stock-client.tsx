'use client';

import { useBusiness } from '@/hooks/use-business';
import { catalogApi, stockApi, apiCache, type Item } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RefreshCw, Plus, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function StockClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    item_id: '',
    type: 'ENTREE' as const,
    quantite: 1,
    motif: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!active) return;
    setLoading(true);
    Promise.all([
      stockApi.list(active.id).then((r) => r.results),
      catalogApi.items(active.id, { limit: 50 }).then((r) => r.results)
    ])
      .then(([stock, its]) => {
        setRows(stock || []);
        setItems(its || []);
        if (its && its[0] && !form.item_id)
          setForm((f) => ({ ...f, item_id: its[0].id }));
      })
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
    apiCache.invalidate('stock');
    apiCache.invalidate('items');
    load();
    toast.success('Stock actualisé');
  };

  const submit = async () => {
    if (!active || !form.item_id || !form.motif) return;
    setSubmitting(true);
    try {
      await stockApi.create(active.id, form);
      toast.success('Mouvement de stock enregistré !');
      setForm((f) => ({ ...f, quantite: 1, motif: '' }));
      load();
    } catch (e) {
      setError((e as Error).message);
      toast.error('Erreur lors du mouvement de stock');
    } finally {
      setSubmitting(false);
    }
  };

  if (!active)
    return (
      <p className='text-muted-foreground text-sm'>
        Sélectionnez un business via le switcher.
      </p>
    );

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='text-lg font-semibold'>
          Gestion des Stocks & Mouvements
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

      <div className='bg-card space-y-3 rounded-lg border p-4'>
        <h4 className='flex items-center gap-1.5 text-sm font-medium'>
          <Plus className='text-primary h-4 w-4' /> Nouveau mouvement
        </h4>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-4'>
          <div className='space-y-1'>
            <Label>Article</Label>
            <Select
              value={form.item_id}
              onValueChange={(v) => setForm({ ...form, item_id: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder='Sélectionner un article' />
              </SelectTrigger>
              <SelectContent>
                {items.map((it) => (
                  <SelectItem key={it.id} value={it.id}>
                    {it.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='space-y-1'>
            <Label>Type</Label>
            <Select
              value={form.type}
              onValueChange={(v: any) => setForm({ ...form, type: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
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
            <Input
              type='number'
              min={1}
              value={form.quantite}
              onChange={(e) =>
                setForm({ ...form, quantite: parseInt(e.target.value) || 1 })
              }
            />
          </div>
          <div className='space-y-1'>
            <Label>Motif</Label>
            <Input
              value={form.motif}
              onChange={(e) => setForm({ ...form, motif: e.target.value })}
              placeholder='Ex: Achat, Casse, Retour client...'
            />
          </div>
        </div>
        <Button
          onClick={submit}
          disabled={submitting || !form.motif || !form.item_id}
          size='sm'
        >
          {submitting ? 'Envoi...' : 'Créer mouvement'}
        </Button>
      </div>

      <div className='bg-card rounded-lg border'>
        <div className='flex items-center gap-2 border-b p-4 text-sm font-semibold'>
          <Package className='h-4 w-4' /> Historique des mouvements (
          {rows.length})
        </div>
        {loading ? (
          <p className='text-muted-foreground p-4 text-sm'>
            Chargement stock...
          </p>
        ) : (
          <div className='divide-y'>
            {rows.slice(0, 30).map((r: any) => (
              <div
                key={r.id}
                className='flex items-center justify-between p-3 text-sm'
              >
                <div>
                  <span className='font-medium'>{r.item_nom ?? r.item_id}</span>
                  {r.motif && (
                    <span className='text-muted-foreground ml-2 text-xs italic'>
                      — {r.motif}
                    </span>
                  )}
                </div>
                <div className='flex items-center gap-3'>
                  <span className='bg-muted rounded px-2 py-0.5 font-mono text-xs font-semibold'>
                    {r.type} ×{r.quantite}
                  </span>
                  <span className='text-muted-foreground text-xs'>
                    {r.acteur?.email ?? '-'}
                  </span>
                </div>
              </div>
            ))}
            {!rows.length && (
              <p className='text-muted-foreground p-4 text-center text-sm'>
                Aucun mouvement enregistré.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
