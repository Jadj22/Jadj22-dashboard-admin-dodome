'use client';

import { useBusiness } from '@/hooks/use-business';
import { catalogApi, type Category } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Plus,
  Trash2,
  FolderTree,
  Search,
  Layers,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

export default function CategoriesClient() {
  const {
    active,
    businesses,
    loading: businessLoading,
    refetchContext
  } = useBusiness();
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ nom: '', description: '', parent_id: '' });

  const load = () => {
    if (!active?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    catalogApi
      .categories(active.id)
      .then((data) => setRows(data || []))
      .catch((e) => toast.error((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [active?.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active?.id) {
      toast.error('Veuillez sélectionner un espace de travail actif.');
      return;
    }
    if (!form.nom.trim()) {
      toast.error('Le nom de la catégorie est obligatoire.');
      return;
    }
    setSubmitting(true);
    try {
      await catalogApi.categories.create(active.id, {
        nom: form.nom.trim(),
        description: form.description.trim() || undefined,
        parent_id: form.parent_id || null
      });
      toast.success(`Catégorie "${form.nom}" créée avec succès !`);
      setForm({ nom: '', description: '', parent_id: '' });
      setIsCreateOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de la création de la catégorie');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (cat: Category) => {
    if (!active?.id) return;
    if (
      !confirm(
        `Supprimer la catégorie "${cat.nom}" ? Cette action est irréversible.`
      )
    ) {
      return;
    }
    try {
      await catalogApi.categories.remove(active.id, cat.id);
      toast.success(`Catégorie "${cat.nom}" supprimée`);
      load();
    } catch (e: any) {
      toast.error(e.message || 'Impossible de supprimer cette catégorie');
    }
  };

  const filtered = rows.filter(
    (c) =>
      c.nom.toLowerCase().includes(search.toLowerCase()) ||
      (c.description &&
        c.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className='space-y-6'>
      {/* Barre d'action supérieure — Toujours visible */}
      <div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
        <div className='relative w-full sm:w-80'>
          <Search className='text-muted-foreground absolute top-2.5 left-3 h-4 w-4' />
          <Input
            placeholder='Rechercher une catégorie...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='pl-9'
          />
        </div>

        {/* Modal de création de catégorie */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className='w-full gap-2 sm:w-auto'>
              <Plus className='h-4 w-4' />
              Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-[480px]'>
            <form onSubmit={submit}>
              <DialogHeader>
                <DialogTitle>Créer une catégorie</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle catégorie pour organiser les articles de
                  votre catalogue.
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4 py-4'>
                <div className='space-y-1.5'>
                  <Label htmlFor='cat-name'>Nom de la catégorie *</Label>
                  <Input
                    id='cat-name'
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder='Ex: Chaises, Sonorisation, Tentes...'
                    autoFocus
                    required
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='cat-desc'>Description (optionnelle)</Label>
                  <Textarea
                    id='cat-desc'
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                    placeholder='Précisez le type de matériel regroupé...'
                    className='resize-none'
                    rows={3}
                  />
                </div>

                <div className='space-y-1.5'>
                  <Label htmlFor='cat-parent'>
                    Catégorie parente (optionnelle)
                  </Label>
                  <Select
                    value={form.parent_id}
                    onValueChange={(v) =>
                      setForm({ ...form, parent_id: v === 'none' ? '' : v })
                    }
                  >
                    <SelectTrigger id='cat-parent'>
                      <SelectValue placeholder='Aucune (Catégorie racine)' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>
                        Aucune (Catégorie racine)
                      </SelectItem>
                      {rows.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setIsCreateOpen(false)}
                  disabled={submitting}
                >
                  Annuler
                </Button>
                <Button type='submit' disabled={submitting || !form.nom.trim()}>
                  {submitting ? 'Création en cours...' : 'Créer la catégorie'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contenu principal */}
      {!active && !businessLoading ? (
        <div className='bg-card/60 flex flex-col items-center justify-center rounded-lg border p-8 text-center'>
          <Layers className='text-muted-foreground mb-3 h-12 w-12' />
          <h3 className='text-lg font-semibold'>
            Aucun espace de travail actif
          </h3>
          <p className='text-muted-foreground mt-1 max-w-md text-sm'>
            Vous devez être connecté avec un compte membre d'une organisation
            pour gérer les catégories.
          </p>
          <Button
            variant='outline'
            size='sm'
            className='mt-4 gap-2'
            onClick={() => refetchContext()}
          >
            <RefreshCw className='h-3.5 w-3.5' />
            Actualiser
          </Button>
        </div>
      ) : loading ? (
        <div className='text-muted-foreground p-8 text-center text-sm'>
          Chargement des catégories...
        </div>
      ) : filtered.length === 0 ? (
        <div className='bg-card/50 rounded-lg border border-dashed p-12 text-center'>
          <FolderTree className='text-muted-foreground/60 mx-auto mb-3 h-12 w-12' />
          <h3 className='text-base font-medium'>
            {search ? 'Aucun résultat trouvé' : 'Aucune catégorie configurée'}
          </h3>
          <p className='text-muted-foreground mx-auto mt-1 max-w-sm text-sm'>
            {search
              ? `Aucune catégorie ne correspond à "${search}".`
              : 'Créez votre première catégorie pour organiser vos articles et équipements.'}
          </p>
          {!search && (
            <Button
              variant='outline'
              size='sm'
              className='mt-4 gap-1.5'
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className='h-4 w-4' />
              Créer une catégorie
            </Button>
          )}
        </div>
      ) : (
        <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-3'>
          {filtered.map((cat) => {
            const parent = rows.find((p) => p.id === cat.parent_id);
            return (
              <div
                key={cat.id}
                className='bg-card hover:border-primary/40 flex flex-col justify-between rounded-lg border p-4 shadow-xs transition-colors'
              >
                <div>
                  <div className='flex items-start justify-between gap-2'>
                    <h4 className='text-base leading-tight font-semibold'>
                      {cat.nom}
                    </h4>
                    <span className='bg-primary/10 text-primary inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium'>
                      {cat.item_count || 0} article
                      {cat.item_count > 1 ? 's' : ''}
                    </span>
                  </div>
                  {cat.description ? (
                    <p className='text-muted-foreground mt-1.5 line-clamp-2 text-xs'>
                      {cat.description}
                    </p>
                  ) : (
                    <p className='text-muted-foreground/60 mt-1.5 text-xs italic'>
                      Aucune description
                    </p>
                  )}
                </div>

                <div className='text-muted-foreground mt-3 flex items-center justify-between border-t pt-3 text-xs'>
                  <span>
                    {parent ? (
                      <span className='text-primary inline-flex items-center gap-1'>
                        <FolderTree className='h-3 w-3' />
                        {parent.nom}
                      </span>
                    ) : (
                      'Catégorie principale'
                    )}
                  </span>
                  <Button
                    size='icon'
                    variant='ghost'
                    className='text-muted-foreground hover:text-destructive h-7 w-7'
                    onClick={() => remove(cat)}
                    title='Supprimer la catégorie'
                  >
                    <Trash2 className='h-3.5 w-3.5' />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
