'use client';

import { AlertModal } from '@/components/modal/alert-modal';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Item } from '@/lib/dodome-api';
import { Edit, Eye, MoreHorizontal, Package, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useBusiness } from '@/hooks/use-business';
import { catalogApi } from '@/lib/dodome-api';
import { toast } from 'sonner';
import { ProductDetailDialog } from '../product-detail-dialog';

interface CellActionProps {
  data: Item;
}

export const CellAction: React.FC<CellActionProps> = ({ data }) => {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const router = useRouter();
  const { active } = useBusiness();

  const onConfirm = async () => {
    if (!active?.id) return;
    try {
      setLoading(true);
      await catalogApi.items.remove(active.id, String(data.id));
      toast.success('Article supprimé du catalogue');
      setOpen(false);
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AlertModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onConfirm={onConfirm}
        loading={loading}
      />
      <ProductDetailDialog
        item={data}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onDelete={() => setOpen(true)}
      />
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Menu actions</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-44'>
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            className='cursor-pointer gap-2'
            onClick={() => setDetailOpen(true)}
          >
            <Eye className='text-primary h-4 w-4' /> Voir détails
          </DropdownMenuItem>
          <DropdownMenuItem
            className='cursor-pointer gap-2'
            onClick={() => router.push(`/dashboard/product/${data.id}`)}
          >
            <Edit className='h-4 w-4' /> Modifier
          </DropdownMenuItem>
          <DropdownMenuItem
            className='cursor-pointer gap-2'
            onClick={() => router.push(`/dashboard/stock`)}
          >
            <Package className='h-4 w-4' /> Gérer le stock
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className='text-destructive focus:text-destructive cursor-pointer gap-2'
            onClick={() => setOpen(true)}
          >
            <Trash className='h-4 w-4' /> Supprimer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
