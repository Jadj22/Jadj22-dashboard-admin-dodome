'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Item } from '@/lib/dodome-api';
import {
  Package,
  Tag,
  DollarSign,
  Layers,
  Wrench,
  Edit,
  Trash2,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface ProductDetailDialogProps {
  item: Item | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete?: (item: Item) => void;
}

export function ProductDetailDialog({
  item,
  open,
  onOpenChange,
  onDelete
}: ProductDetailDialogProps) {
  const router = useRouter();
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  if (!item) return null;

  const photos = item.photos || [];
  const primaryImage = photos[selectedPhotoIndex]?.image || photos[0]?.image;
  const price = parseFloat(item.prix) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-[650px]'>
        <DialogHeader>
          <div className='flex items-center justify-between gap-2 pr-6'>
            <DialogTitle className='text-xl font-bold'>{item.nom}</DialogTitle>
            <Badge
              variant={item.statut === 'ACTIF' ? 'default' : 'secondary'}
              className={
                item.statut === 'ACTIF'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : ''
              }
            >
              {item.statut}
            </Badge>
          </div>
          {item.reference && (
            <DialogDescription className='font-mono text-xs'>
              Référence : {item.reference}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className='space-y-6 py-2'>
          {/* Galerie Photos */}
          <div className='space-y-2'>
            <div className='bg-muted/30 relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl border'>
              {primaryImage ? (
                <Image
                  src={primaryImage}
                  alt={item.nom}
                  fill
                  className='object-contain'
                  sizes='(max-width: 650px) 100vw, 650px'
                />
              ) : (
                <div className='text-muted-foreground flex flex-col items-center gap-2'>
                  <Package className='h-16 w-16 stroke-1' />
                  <span className='text-xs'>Aucune photo disponible</span>
                </div>
              )}
            </div>

            {photos.length > 1 && (
              <div className='flex gap-2 overflow-x-auto pb-1'>
                {photos.map((p, idx) => (
                  <button
                    key={p.id || idx}
                    type='button'
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border transition-all ${
                      selectedPhotoIndex === idx
                        ? 'ring-primary border-primary ring-2'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={p.image}
                      alt={`Photo ${idx + 1}`}
                      fill
                      className='object-cover'
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grille d'informations clés */}
          <div className='grid grid-cols-2 gap-3 sm:grid-cols-3'>
            <div className='bg-card rounded-lg border p-3'>
              <div className='text-muted-foreground mb-1 flex items-center gap-1.5 text-xs'>
                <DollarSign className='h-3.5 w-3.5' />
                Prix Unitaire
              </div>
              <p className='text-primary text-base font-bold'>
                {price.toLocaleString()} FCFA
              </p>
              <p className='text-muted-foreground text-[10px] uppercase'>
                Par {item.unite || 'UNITE'}
              </p>
            </div>

            <div className='bg-card rounded-lg border p-3'>
              <div className='text-muted-foreground mb-1 flex items-center gap-1.5 text-xs'>
                <Tag className='h-3.5 w-3.5' />
                Catégorie
              </div>
              <p className='truncate text-sm font-semibold'>
                {item.category?.nom || 'Non catégorisé'}
              </p>
            </div>

            <div className='bg-card col-span-2 rounded-lg border p-3 sm:col-span-1'>
              <div className='text-muted-foreground mb-1 flex items-center gap-1.5 text-xs'>
                <Layers className='h-3.5 w-3.5' />
                Visibilité Vitrine
              </div>
              <Badge
                variant={item.is_published ? 'outline' : 'secondary'}
                className='text-xs'
              >
                {item.is_published ? 'Publié en ligne' : 'Privé'}
              </Badge>
            </div>
          </div>

          {/* Description */}
          {item.description ? (
            <div className='space-y-1.5'>
              <h4 className='text-muted-foreground text-xs font-semibold tracking-wider uppercase'>
                Description
              </h4>
              <p className='text-foreground/90 bg-muted/20 rounded-lg border p-3 text-sm leading-relaxed whitespace-pre-wrap'>
                {item.description}
              </p>
            </div>
          ) : null}

          {/* Entretien */}
          {item.entretien_requis !== null && (
            <div className='text-muted-foreground bg-card flex items-center gap-2 rounded-lg border p-2.5 text-xs'>
              <Wrench className='h-4 w-4 shrink-0 text-amber-500' />
              <span>
                {item.entretien_requis
                  ? 'Entretien requis après utilisation'
                  : 'Aucun entretien particulier requis'}
              </span>
            </div>
          )}

          <Separator />

          {/* Barre d'actions */}
          <div className='flex flex-wrap items-center justify-between gap-2 pt-1'>
            {onDelete ? (
              <Button
                variant='ghost'
                size='sm'
                className='text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5'
                onClick={() => {
                  onOpenChange(false);
                  onDelete(item);
                }}
              >
                <Trash2 className='h-4 w-4' />
                Supprimer
              </Button>
            ) : (
              <div />
            )}

            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                className='gap-1.5'
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/dashboard/stock`);
                }}
              >
                <Package className='h-4 w-4' />
                Mouvement Stock
              </Button>

              <Button
                size='sm'
                className='gap-1.5'
                onClick={() => {
                  onOpenChange(false);
                  router.push(`/dashboard/product/${item.id}`);
                }}
              >
                <Edit className='h-4 w-4' />
                Modifier l'article
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
