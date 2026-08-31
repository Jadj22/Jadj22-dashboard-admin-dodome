'use client';

import { useBusiness } from '@/hooks/use-business';
import {
  catalogApi,
  maintenanceApi,
  apiCache,
  type Item
} from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RefreshCw, Wrench, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function MaintenanceClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ item_id: '', titre: '', notes: '' });

  const load = () => {
    if (!active) return;
    setLoading(true);
    Promise.all([
      maintenanceApi.tasks(active.id),
      catalogApi.items(active.id, { limit: 50 }).then((r) => r.results)
    ])
      .then(([tasks, its]) => {
        setRows(tasks || []);
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
    apiCache.invalidate('maintenance');
    apiCache.invalidate('items');
    load();
    toast.success('Opérations de maintenance actualisées');
  };

  const create = async () => {
    if (!active || !form.item_id || !form.titre) return;
    try {
      await maintenanceApi.createTask(active.id, form);
      toast.success('Tâche de maintenance enregistrée');
      setForm((f) => ({ ...f, titre: '', notes: '' }));
      load();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la création');
    }
  };

  const cloture = async (taskId: string) => {
    if (!active) return;
    try {
      await maintenanceApi.cloture(active.id, taskId, 'OK');
      toast.success('Opération d’entretien clôturée');
      load();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la clôture');
    }
  };

  if (!active)
    return (
      <p className='text-muted-foreground text-sm'>Sélectionnez un business.</p>
    );

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='flex items-center gap-2 text-lg font-semibold'>
          <Wrench className='h-5 w-5' /> Entretien & Maintenance du Matériel
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

      <div className='bg-card space-y-3 rounded-lg border p-4'>
        <h4 className='flex items-center gap-1.5 text-sm font-medium'>
          <Plus className='text-primary h-4 w-4' /> Nouvelle opération
        </h4>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
          <Select
            value={form.item_id}
            onValueChange={(v) => setForm({ ...form, item_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder='Équipement concerné' />
            </SelectTrigger>
            <SelectContent>
              {items.map((it) => (
                <SelectItem key={it.id} value={it.id}>
                  {it.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder='Titre / Nature de l’intervention *'
            value={form.titre}
            onChange={(e) => setForm({ ...form, titre: e.target.value })}
          />
          <Input
            placeholder='Détails / Instructions...'
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>
        <Button
          onClick={create}
          disabled={!form.titre.trim() || !form.item_id}
          size='sm'
        >
          Créer la tâche
        </Button>
      </div>

      {loading ? (
        <p className='text-muted-foreground text-sm'>
          Chargement des opérations...
        </p>
      ) : (
        <div className='bg-card divide-y rounded-lg border'>
          {rows.map((t: any) => (
            <div
              key={t.id}
              className='flex items-center justify-between p-4 text-sm'
            >
              <div>
                <p className='font-medium'>
                  {t.titre} —{' '}
                  <span className='text-muted-foreground text-xs'>
                    {t.item_nom ?? 'Équipement'}
                  </span>
                </p>
                <p className='text-muted-foreground text-xs'>
                  Statut : {t.statut}
                </p>
              </div>
              {t.statut === 'A_FAIRE' && (
                <Button
                  size='sm'
                  variant='outline'
                  onClick={() => cloture(t.id)}
                >
                  Valider et Clôturer
                </Button>
              )}
            </div>
          ))}
          {!rows.length && (
            <p className='text-muted-foreground p-8 text-center text-sm'>
              Aucune opération de maintenance en attente.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
