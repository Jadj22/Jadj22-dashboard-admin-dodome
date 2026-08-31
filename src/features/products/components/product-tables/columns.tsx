'use client';

import { Item } from '@/lib/dodome-api';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { Package } from 'lucide-react';
import Image from 'next/image';

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: 'photo',
    header: 'PHOTO',
    cell: ({ row }) => {
      const item = row.original;
      const photoUrl = item.photos?.[0]?.image;

      return (
        <div className='bg-muted/40 relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border'>
          {photoUrl ? (
            <Image
              src={photoUrl}
              alt={item.nom}
              fill
              className='object-cover'
              sizes='48px'
            />
          ) : (
            <Package className='text-muted-foreground/60 h-5 w-5' />
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'nom',
    header: 'ARTICLE',
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div className='max-w-[200px] sm:max-w-xs'>
          <div className='text-foreground truncate text-sm leading-tight font-semibold'>
            {item.nom}
          </div>
          {item.reference && (
            <div className='text-muted-foreground mt-0.5 font-mono text-[11px]'>
              Réf: {item.reference}
            </div>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'category',
    header: 'CATÉGORIE',
    cell: ({ row }) => {
      const cat = row.original.category;
      return cat?.nom ? (
        <span className='bg-primary/10 text-primary inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium'>
          {cat.nom}
        </span>
      ) : (
        <span className='text-muted-foreground/70 text-xs italic'>
          Non catégorisé
        </span>
      );
    }
  },
  {
    accessorKey: 'prix',
    header: 'PRIX UNITAIRE',
    cell: ({ row }) => {
      const p = parseFloat(row.original.prix) || 0;
      return (
        <span className='text-sm font-semibold'>{p.toLocaleString()} FCFA</span>
      );
    }
  },
  {
    accessorKey: 'unite',
    header: 'UNITÉ',
    cell: ({ row }) => (
      <span className='text-muted-foreground text-xs font-medium uppercase'>
        {row.original.unite || 'UNITE'}
      </span>
    )
  },
  {
    accessorKey: 'statut',
    header: 'STATUT',
    cell: ({ row }) => {
      const statut = row.original.statut;
      return (
        <span
          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
            statut === 'ACTIF'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-muted text-muted-foreground'
          }`}
        >
          {statut}
        </span>
      );
    }
  },
  {
    accessorKey: 'description',
    header: 'DESCRIPTION',
    cell: ({ row }) => (
      <span className='text-muted-foreground line-clamp-1 max-w-[200px] text-xs'>
        {row.original.description || '-'}
      </span>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
