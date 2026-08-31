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
import { Textarea } from '@/components/ui/textarea';
import { useTaskStore } from '../utils/store';
import { Plus } from 'lucide-react';

export default function NewTaskDialog() {
  const addTask = useTaskStore((state) => state.addTask);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const { title, description } = Object.fromEntries(formData);

    if (typeof title !== 'string' || !title.trim()) return;
    addTask(
      title.trim(),
      typeof description === 'string' ? description.trim() : undefined
    );
    form.reset();
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant='default' size='sm' className='gap-1.5'>
          <Plus className='h-4 w-4' />
          Nouvelle tâche
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Ajouter une tâche</DialogTitle>
          <DialogDescription>
            Créez une tâche à suivre sur votre tableau Kanban.
          </DialogDescription>
        </DialogHeader>
        <form
          id='todo-form'
          className='grid gap-4 py-4'
          onSubmit={handleSubmit}
        >
          <div className='space-y-1.5'>
            <Input
              id='title'
              name='title'
              placeholder='Titre de la tâche *'
              required
            />
          </div>
          <div className='space-y-1.5'>
            <Textarea
              id='description'
              name='description'
              placeholder='Détails ou instructions...'
              className='resize-none'
              rows={3}
            />
          </div>
        </form>
        <DialogFooter>
          <DialogTrigger asChild>
            <Button type='submit' size='sm' form='todo-form'>
              Ajouter
            </Button>
          </DialogTrigger>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
