'use client';

import { useBusiness } from '@/hooks/use-business';
import { catalogApi, type Category } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function CategoriesClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ nom: '', description: '', parent_id: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!active) return;
    setLoading(true);
    catalogApi
      .categories(active.id)
      .then(setRows)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [active?.id]);

  const submit = async () => {
    if (!active || !form.nom.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      await catalogApi.categories.create(active.id, {
        nom: form.nom.trim(),
        description: form.description || undefined,
        parent_id: form.parent_id || null,
      });
      setForm({ nom: '', description: '', parent_id: '' });
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!active || !confirm('Supprimer cette catégorie ? (409 si articles dedans)')) return;
    try {
      await catalogApi.categories.remove(active.id, id);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!active) return <p className='text-sm text-muted-foreground'>Sélectionnez un business.</p>;

  return (
    <div className='space-y-6'>
      {error && <p className='text-sm text-destructive'>Erreur: {error}</p>}

      <div className='rounded-md border p-4 space-y-3'>
        <h3 className='font-medium text-sm'>Nouvelle catégorie</h3>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
          <div className='space-y-1'>
            <Label>Nom *</Label>
            <Input value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} placeholder='Ex: Chaises' />
          </div>
          <div className='space-y-1'>
            <Label>Description</Label>
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder='Optionnel' />
          </div>
          <div className='space-y-1'>
            <Label>Parent</Label>
            <Select value={form.parent_id} onValueChange={(v) => setForm({ ...form, parent_id: v === 'none' ? '' : v })}>
              <SelectTrigger><SelectValue placeholder='Aucun' /></SelectTrigger>
              <SelectContent>
                <SelectItem value='none'>Aucun</SelectItem>
                {rows.map((c) => <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-end'>
            <Button onClick={submit} disabled={submitting || !form.nom.trim()} size='sm' className='w-full'>{submitting ? 'Création...' : 'Créer'}</Button>
          </div>
        </div>
      </div>

      {loading ? (
        <p className='text-sm'>Chargement...</p>
      ) : !rows.length ? (
        <p className='text-sm text-muted-foreground'>Aucune catégorie. Créez la première.</p>
      ) : (
        <div className='rounded-md border divide-y'>
          {rows.map((c) => (
            <div key={c.id} className='flex justify-between p-3 text-sm items-center'>
              <div>
                <div className='font-medium'>{c.nom} <span className='text-muted-foreground'>· {c.item_count} articles</span></div>
                <div className='text-xs text-muted-foreground'>{c.description || '-'}</div>
              </div>
              <div className='flex gap-2 items-center'>
                <span className='text-xs text-muted-foreground hidden md:inline'>{c.parent_id ? `parent: ${rows.find((p) => p.id === c.parent_id)?.nom ?? c.parent_id.slice(0, 8)}` : 'racine'}</span>
                <Button size='sm' variant='outline' onClick={() => remove(c.id)}>Supprimer</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
