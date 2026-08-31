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
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

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
      if (values.category) {
        payload.category_id = values.category;
      }

      if (initialData?.id) {
        await catalogApi.items.update(
          active.id,
          String(initialData.id),
          payload
        );
        toast.success('Article mis à jour !');
      } else {
        await catalogApi.items.create(active.id, payload);
        toast.success('Article créé avec succès !');
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
                        step='1'
                        placeholder='0'
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
                    <FormLabel>Unité de mesure</FormLabel>
                    <FormControl>
                      <Input placeholder='Ex: UNITE, JOUR, LOT' {...field} />
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
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Détails, caractéristiques, état...'
                      className='resize-none'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type='submit' disabled={loading}>
              {loading
                ? 'Enregistrement...'
                : initialData?.id
                  ? 'Mettre à jour'
                  : 'Ajouter au catalogue'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
