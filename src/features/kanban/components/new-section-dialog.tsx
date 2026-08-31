'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useTaskStore } from '../utils/store';
import { Plus } from 'lucide-react';

export default function NewSectionDialog() {
  const addCol = useTaskStore((state) => state.addCol);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const { title } = Object.fromEntries(formData);

    if (typeof title !== 'string' || !title.trim()) return;
    addCol(title.trim());
    form.reset();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant='outline'
          size='lg'
          className='w-full gap-1.5 border-dashed'
        >
          <Plus className='h-4 w-4' />
          Nouvelle colonne
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Ajouter une colonne</DialogTitle>
          <DialogDescription>
            Créez une nouvelle colonne d'état pour votre tableau.
          </DialogDescription>
        </DialogHeader>
        <form
          id='section-form'
          className='grid gap-4 py-4'
          onSubmit={handleSubmit}
        >
          <div className='space-y-1.5'>
            <Input
              id='title'
              name='title'
              placeholder='Ex: En attente, Validé...'
              required
            />
          </div>
        </form>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button type='submit' size='sm' form='section-form'>
              Créer la colonne
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
