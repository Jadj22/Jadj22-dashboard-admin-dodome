'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useBusiness } from '@/hooks/use-business';
import { catalogApi, type Category } from '@/lib/dodome-api';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Upload, X, Trash2, Package } from 'lucide-react';
import Image from 'next/image';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Le nom de l'article doit comporter au moins 2 caractères."
  }),
  category: z.string().optional(),
  price: z.coerce.number().min(0, {
    message: 'Le prix doit être positif.'
  }),
  unite: z.string().default('UNITE'),
  description: z.string().default('')
});

export default function ProductForm({
  initialData,
  pageTitle
}: {
  initialData: any | null;
  pageTitle: string;
}) {
  const { active } = useBusiness();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<
    { id: string; image: string }[]
  >(initialData?.photos || []);

  useEffect(() => {
    if (!active?.id) return;
    catalogApi
      .categories(active.id)
      .then((res) => setCategories(res || []))
      .catch(() => setCategories([]));
  }, [active?.id]);

  const defaultValues = {
    name: initialData?.nom || initialData?.name || '',
    category: initialData?.category?.id || initialData?.category_id || '',
    price: Number(initialData?.prix || initialData?.price || 0),
    unite: initialData?.unite || 'UNITE',
    description: initialData?.description || ''
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: defaultValues
  });

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const totalCount = existingPhotos.length + newFiles.length + files.length;
    if (totalCount > 5) {
      toast.error('Maximum 5 photos par article.');
      return;
    }

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const f of files) {
      if (f.size > 5 * 1024 * 1024) {
        toast.error(`Le fichier ${f.name} dépasse 5 Mo.`);
        continue;
      }
      validFiles.push(f);
      validPreviews.push(URL.createObjectURL(f));
    }

    setNewFiles((prev) => [...prev, ...validFiles]);
    setNewPreviews((prev) => [...prev, ...validPreviews]);
  };

  const removeNewFile = (index: number) => {
    URL.revokeObjectURL(newPreviews[index]);
    setNewFiles((prev) => prev.filter((_, i) => i !== index));
    setNewPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const deleteExistingPhoto = async (photoId: string) => {
    if (!active?.id || !initialData?.id) return;
    try {
      await catalogApi.items.deletePhoto(
        active.id,
        String(initialData.id),
        photoId
      );
      setExistingPhotos((prev) => prev.filter((p) => p.id !== photoId));
      toast.success('Photo supprimée');
    } catch (e: any) {
      toast.error(e.message || 'Impossible de supprimer la photo');
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!active?.id) {
      toast.error('Aucun business actif sélectionné');
      return;
    }

    try {
      setLoading(true);
      const payload: Record<string, unknown> = {
        nom: values.name,
        prix: String(values.price),
        unite: values.unite || 'UNITE',
        description: values.description,
        statut: 'ACTIF'
      };
      if (values.category && values.category !== 'none') {
        payload.category_id = values.category;
      } else {
        payload.category_id = null;
      }

      let itemId = initialData?.id ? String(initialData.id) : null;

      if (itemId) {
        await catalogApi.items.update(active.id, itemId, payload);
        toast.success('Article mis à jour !');
      } else {
        const created = await catalogApi.items.create(active.id, payload);
        itemId = String(created.id);
        toast.success('Article créé avec succès !');
      }

      // Téléversement des nouvelles photos
      if (itemId && newFiles.length > 0) {
        for (const file of newFiles) {
          try {
            await catalogApi.items.uploadPhoto(active.id, itemId, file);
          } catch (photoErr: any) {
            console.warn('Erreur téléversement photo:', photoErr);
          }
        }
      }

      router.push('/dashboard/product');
      router.refresh();
    } catch (err: any) {
      toast.error(
        err.message || "Erreur lors de l'enregistrement de l'article"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {pageTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-8'>
            {/* Zone Galerie Photos */}
            <div className='space-y-3'>
              <FormLabel className='text-sm font-semibold'>
                Photos de l'article (jusqu'à 5 photos)
              </FormLabel>

              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                multiple
                onChange={handleFilesSelected}
                className='hidden'
              />

              <div className='grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5'>
                {/* Photos déjà existantes */}
                {existingPhotos.map((p) => (
                  <div
                    key={p.id}
                    className='group bg-muted/30 relative aspect-square overflow-hidden rounded-xl border'
                  >
                    <Image
                      src={p.image}
                      alt='Photo existante'
                      fill
                      className='object-cover'
                    />
                    <Button
                      type='button'
                      size='icon'
                      variant='destructive'
                      className='absolute top-1.5 right-1.5 h-6 w-6 rounded-full opacity-90 shadow-sm group-hover:opacity-100'
                      onClick={() => deleteExistingPhoto(p.id)}
                    >
                      <Trash2 className='h-3 w-3' />
                    </Button>
                  </div>
                ))}

                {/* Nouvelles photos prêtes à être envoyées */}
                {newPreviews.map((previewUrl, idx) => (
                  <div
                    key={idx}
                    className='group border-primary/50 bg-muted/30 relative aspect-square overflow-hidden rounded-xl border-2'
                  >
                    <Image
                      src={previewUrl}
                      alt={`Nouvelle photo ${idx + 1}`}
                      fill
                      className='object-cover'
                    />
                    <Button
                      type='button'
                      size='icon'
                      variant='destructive'
                      className='absolute top-1.5 right-1.5 h-6 w-6 rounded-full shadow-sm'
                      onClick={() => removeNewFile(idx)}
                    >
                      <X className='h-3 w-3' />
                    </Button>
                  </div>
                ))}

                {/* Bouton d'ajout de photo */}
                {existingPhotos.length + newFiles.length < 5 && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className='border-muted-foreground/30 hover:border-primary hover:bg-muted/30 flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-3 text-center transition-all'
                  >
                    <Upload className='text-muted-foreground mb-1 h-6 w-6' />
                    <span className='text-xs font-medium'>Ajouter photo</span>
                    <span className='text-muted-foreground text-[10px]'>
                      {existingPhotos.length + newFiles.length}/5
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'article *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ex: Chaise Napoléon Blanche'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='category'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catégorie</FormLabel>
                    <Select
                      onValueChange={(val) => field.onChange(val)}
                      value={field.value || undefined}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Sélectionner une catégorie' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='none'>
                          Aucune catégorie (Non catégorisé)
                        </SelectItem>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='price'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prix unitaire (FCFA)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='any'
                        placeholder='Ex: 5000'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='unite'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unité de facturation</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Ex: JOUR, HEURE, PIECE, LOT...'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description détaillée</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Décrivez l'article, ses caractéristiques, ses dimensions..."
                      className='resize-none'
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type='submit'
              disabled={loading}
              className='w-full sm:w-auto'
            >
              {loading ? 'Enregistrement en cours...' : 'Enregistrer l’article'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
