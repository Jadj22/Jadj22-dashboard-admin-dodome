'use client';

import { useBusiness } from '@/hooks/use-business';
import { maintenanceApi, catalogApi } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MaintenanceClient() {
  const { active } = useBusiness();
  const [procedures, setProcedures] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newProc, setNewProc] = useState({ nom: '', description: '' });
  const [newTask, setNewTask] = useState({ item_id: '', procedure_id: '', motif: '' });

  const load = () => {
    if (!active) return;
    setLoading(true);
    Promise.all([
      maintenanceApi.procedures.list(active.id).catch(() => []),
      maintenanceApi.tasks.list(active.id).then((r) => r.results).catch(() => []),
      catalogApi.items(active.id, { limit: 50 }).then((r) => r.results).catch(() => []),
    ])
      .then(([procs, ts, its]) => {
        setProcedures(procs);
        setTasks(ts);
        setItems(its);
        if (its[0] && !newTask.item_id) setNewTask((f) => ({ ...f, item_id: its[0].id }));
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [active?.id]);

  const createProc = async () => {
    if (!active || !newProc.nom) return;
    try {
      await maintenanceApi.procedures.create(active.id, { ...newProc, steps_input: [{ nom: 'Contrôle visuel', ordre: 1, obligatoire: true, type: 'CONTROLE', description: '' }] });
      setNewProc({ nom: '', description: '' });
      load();
    } catch (e) { setError((e as Error).message); }
  };

  const createTask = async () => {
    if (!active || !newTask.item_id) return;
    try {
      await maintenanceApi.tasks.create(active.id, { item_id: newTask.item_id, procedure_id: newTask.procedure_id || undefined, motif: newTask.motif });
      setNewTask((f) => ({ ...f, motif: '' }));
      load();
    } catch (e) { setError((e as Error).message); }
  };

  const cloturer = async (taskId: string) => {
    if (!active) return;
    try { await maintenanceApi.tasks.cloture(active.id, taskId); load(); } catch (e) { setError((e as Error).message); }
  };

  if (!active) return <p className='text-sm text-muted-foreground'>Sélectionnez un business.</p>;
  if (loading) return <p className='text-sm'>Chargement entretien...</p>;

  return (
    <div className='space-y-6'>
      {error && <p className='text-sm text-destructive'>Erreur: {error}</p>}

      <div className='rounded-md border p-4 space-y-3'>
        <h3 className='font-medium text-sm'>Nouvelle procédure</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
          <Input placeholder='Nom *' value={newProc.nom} onChange={(e) => setNewProc({ ...newProc, nom: e.target.value })} />
          <Input placeholder='Description' value={newProc.description} onChange={(e) => setNewProc({ ...newProc, description: e.target.value })} />
          <Button onClick={createProc} disabled={!newProc.nom} size='sm'>Créer procédure</Button>
        </div>
        <div className='text-xs text-muted-foreground'>Crée automatiquement une étape CONTRÔLE (RM-09).</div>
        <div className='divide-y rounded border mt-2'>
          {procedures.slice(0, 10).map((p) => <div key={p.id} className='flex justify-between p-2 text-sm'><span>{p.nom}</span><span className='text-muted-foreground'>{p.est_actif ? 'Actif' : 'Inactif'} · {p.steps?.length ?? 0} étapes</span></div>)}
          {!procedures.length && <p className='p-2 text-sm text-muted-foreground'>Aucune procédure.</p>}
        </div>
      </div>

      <div className='rounded-md border p-4 space-y-3'>
        <h3 className='font-medium text-sm'>Nouvelle tâche d'entretien</h3>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
          <Select value={newTask.item_id} onValueChange={(v) => setNewTask({ ...newTask, item_id: v })}>
            <SelectTrigger><SelectValue placeholder='Article' /></SelectTrigger>
            <SelectContent>{items.map((it) => <SelectItem key={it.id} value={it.id}>{it.nom}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={newTask.procedure_id} onValueChange={(v) => setNewTask({ ...newTask, procedure_id: v })}>
            <SelectTrigger><SelectValue placeholder='Procédure (auto si vide)' /></SelectTrigger>
            <SelectContent>{procedures.map((p) => <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder='Motif' value={newTask.motif} onChange={(e) => setNewTask({ ...newTask, motif: e.target.value })} />
          <Button onClick={createTask} disabled={!newTask.item_id} size='sm'>Créer tâche</Button>
        </div>
      </div>

      <div className='rounded-md border'>
        <div className='p-3 font-medium text-sm'>Tâches ({tasks.length})</div>
        <div className='divide-y'>
          {tasks.slice(0, 20).map((t: any) => (
            <div key={t.id} className='flex justify-between p-3 text-sm items-center'>
              <div>
                <div className='font-medium'>{t.item_nom ?? t.procedure_nom} <span className='text-muted-foreground'>· {t.statut}</span></div>
                <div className='text-xs text-muted-foreground'>{t.motif ?? '-'}</div>
              </div>
              {t.statut === 'EN_COURS' && <Button size='sm' variant='outline' onClick={() => cloturer(t.id)}>Clôturer</Button>}
            </div>
          ))}
          {!tasks.length && <p className='p-3 text-sm text-muted-foreground'>Aucune tâche.</p>}
        </div>
      </div>
    </div>
  );
}
