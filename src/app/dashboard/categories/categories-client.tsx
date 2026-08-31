'use client';

import { useBusiness } from '@/hooks/use-business';
import { catalogApi, type Category } from '@/lib/dodome-api';
import { useEffect, useRef, useState } from 'react';
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
  RefreshCw,
  Eye,
  Package,
  Image as ImageIcon,
  Upload,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

export default function CategoriesClient() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const clearImage = () => {
    setImageFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

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
        parent_id: form.parent_id || null,
        image: imageFile
      });
      toast.success(`Catégorie "${form.nom}" créée avec succès !`);
      setForm({ nom: '', description: '', parent_id: '' });
      clearImage();
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
      setSelectedCategory(null);
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
      {/* Barre d'action supérieure */}
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
        <Dialog
          open={isCreateOpen}
          onOpenChange={(open) => {
            setIsCreateOpen(open);
            if (!open) clearImage();
          }}
        >
          <DialogTrigger asChild>
            <Button className='w-full gap-2 sm:w-auto'>
              <Plus className='h-4 w-4' />
              Nouvelle Catégorie
            </Button>
          </DialogTrigger>
          <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[500px]'>
            <form onSubmit={submit}>
              <DialogHeader>
                <DialogTitle>Créer une catégorie</DialogTitle>
                <DialogDescription>
                  Ajoutez une nouvelle catégorie avec un visuel et une
                  description pour organiser vos articles.
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4 py-4'>
                {/* Champ Image / Visuel */}
                <div className='space-y-1.5'>
                  <Label>Image / Icône de la catégorie (optionnelle)</Label>
                  <input
                    ref={fileInputRef}
                    type='file'
                    accept='image/*'
                    onChange={handleImageChange}
                    className='hidden'
                  />
                  {imagePreview ? (
                    <div className='bg-muted/40 relative flex h-32 w-full items-center justify-center overflow-hidden rounded-lg border'>
                      <Image
                        src={imagePreview}
                        alt='Aperçu'
                        fill
                        className='object-contain'
                      />
                      <Button
                        type='button'
                        size='icon'
                        variant='destructive'
                        className='absolute top-2 right-2 h-7 w-7 rounded-full shadow-md'
                        onClick={clearImage}
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className='hover:border-primary/60 hover:bg-muted/30 flex h-28 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors'
                    >
                      <Upload className='text-muted-foreground mb-1.5 h-6 w-6' />
                      <span className='text-foreground text-xs font-medium'>
                        Cliquez pour ajouter une image
                      </span>
                      <span className='text-muted-foreground mt-0.5 text-[11px]'>
                        PNG, JPG, WebP jusqu'à 5 Mo
                      </span>
                    </div>
                  )}
                </div>

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
                  onClick={() => {
                    clearImage();
                    setIsCreateOpen(false);
                  }}
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

      {/* Modal de détail d'une catégorie */}
      <Dialog
        open={!!selectedCategory}
        onOpenChange={(open) => !open && setSelectedCategory(null)}
      >
        <DialogContent className='sm:max-w-[480px]'>
          {selectedCategory && (
            <>
              <DialogHeader>
                <div className='flex items-center justify-between gap-2 pr-4'>
                  <DialogTitle className='text-lg font-bold'>
                    {selectedCategory.nom}
                  </DialogTitle>
                  <Badge variant='outline'>
                    {selectedCategory.item_count || 0} article
                    {(selectedCategory.item_count || 0) > 1 ? 's' : ''}
                  </Badge>
                </div>
                <DialogDescription>
                  {selectedCategory.parent_id ? (
                    <span className='text-primary inline-flex items-center gap-1 text-xs'>
                      <FolderTree className='h-3.5 w-3.5' />
                      Sous-catégorie de :{' '}
                      {rows.find((r) => r.id === selectedCategory.parent_id)
                        ?.nom || 'Catégorie parente'}
                    </span>
                  ) : (
                    'Catégorie principale'
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className='space-y-4 py-2'>
                {/* Visuel catégorie si existant */}
                {selectedCategory.image_url || selectedCategory.image ? (
                  <div className='bg-muted/30 relative h-40 w-full overflow-hidden rounded-lg border'>
                    <Image
                      src={
                        selectedCategory.image_url ||
                        (selectedCategory.image as string)
                      }
                      alt={selectedCategory.nom}
                      fill
                      className='object-cover'
                    />
                  </div>
                ) : null}

                {selectedCategory.description ? (
                  <div className='bg-muted/40 rounded-lg p-3 text-sm'>
                    <p className='text-muted-foreground mb-1 text-xs font-medium tracking-wider uppercase'>
                      Description
                    </p>
                    <p className='text-foreground'>
                      {selectedCategory.description}
                    </p>
                  </div>
                ) : (
                  <p className='text-muted-foreground text-xs italic'>
                    Aucune description pour cette catégorie.
                  </p>
                )}

                <Separator />

                <div className='flex items-center justify-between gap-2 pt-2'>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5'
                    onClick={() => remove(selectedCategory)}
                  >
                    <Trash2 className='h-4 w-4' />
                    Supprimer
                  </Button>

                  <Button
                    size='sm'
                    className='gap-1.5'
                    onClick={() => {
                      setSelectedCategory(null);
                      router.push(
                        `/dashboard/product?categories=${selectedCategory.id}`
                      );
                    }}
                  >
                    <Package className='h-4 w-4' />
                    Voir les articles
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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
        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
          {filtered.map((cat) => {
            const parent = rows.find((p) => p.id === cat.parent_id);
            const categoryImage = cat.image_url || cat.image;

            return (
              <div
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className='bg-card hover:border-primary/50 flex cursor-pointer flex-col justify-between overflow-hidden rounded-lg border p-4 shadow-xs transition-all hover:shadow-sm'
              >
                <div>
                  <div className='flex items-start gap-3'>
                    {/* Vignette Image de catégorie */}
                    <div className='bg-muted/40 relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border'>
                      {categoryImage ? (
                        <Image
                          src={categoryImage}
                          alt={cat.nom}
                          fill
                          className='object-cover'
                          sizes='48px'
                        />
                      ) : (
                        <ImageIcon className='text-muted-foreground/60 h-5 w-5' />
                      )}
                    </div>

                    <div className='min-w-0 flex-1'>
                      <div className='flex items-start justify-between gap-1'>
                        <h4 className='hover:text-primary truncate text-base font-semibold transition-colors'>
                          {cat.nom}
                        </h4>
                        <span className='bg-primary/10 text-primary inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium'>
                          {cat.item_count || 0}
                        </span>
                      </div>
                      {cat.description ? (
                        <p className='text-muted-foreground mt-1 line-clamp-2 text-xs'>
                          {cat.description}
                        </p>
                      ) : (
                        <p className='text-muted-foreground/60 mt-1 text-xs italic'>
                          Aucune description
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className='text-muted-foreground mt-3 flex items-center justify-between border-t pt-3 text-xs'>
                  <span className='truncate'>
                    {parent ? (
                      <span className='text-primary inline-flex items-center gap-1 truncate'>
                        <FolderTree className='h-3 w-3 shrink-0' />
                        {parent.nom}
                      </span>
                    ) : (
                      'Catégorie principale'
                    )}
                  </span>
                  <div className='flex shrink-0 items-center gap-1'>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='text-muted-foreground hover:text-primary h-7 w-7'
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedCategory(cat);
                      }}
                      title='Voir les détails'
                    >
                      <Eye className='h-3.5 w-3.5' />
                    </Button>
                    <Button
                      size='icon'
                      variant='ghost'
                      className='text-muted-foreground hover:text-destructive h-7 w-7'
                      onClick={(e) => {
                        e.stopPropagation();
                        remove(cat);
                      }}
                      title='Supprimer la catégorie'
                    >
                      <Trash2 className='h-3.5 w-3.5' />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
