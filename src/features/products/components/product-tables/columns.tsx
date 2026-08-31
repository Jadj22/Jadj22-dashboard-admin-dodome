'use client';

import { Item } from '@/lib/dodome-api';
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';

export const columns: ColumnDef<Item>[] = [
  {
    accessorKey: 'nom',
    header: 'ARTICLE',
    cell: ({ row }) => {
      const item = row.original;
      return (
        <div>
          <div className='font-medium'>{item.nom}</div>
          {item.reference && (
            <div className='text-muted-foreground font-mono text-xs'>
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
        <span className='bg-muted inline-flex items-center rounded px-2 py-0.5 text-xs font-medium'>
          {cat.nom}
        </span>
      ) : (
        <span className='text-muted-foreground text-xs'>Non catégorisé</span>
      );
    }
  },
  {
    accessorKey: 'prix',
    header: 'PRIX UNITAIRE',
    cell: ({ row }) => {
      const p = parseFloat(row.original.prix) || 0;
      return <span className='font-semibold'>{p.toLocaleString()} FCFA</span>;
    }
  },
  {
    accessorKey: 'unite',
    header: 'UNITÉ',
    cell: ({ row }) => (
      <span className='text-muted-foreground text-xs uppercase'>
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
              ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
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
      <span className='text-muted-foreground line-clamp-1 max-w-xs text-xs'>
        {row.original.description || '-'}
      </span>
    )
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
