'use client';

import { useBusiness } from '@/hooks/use-business';
import { membersApi } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function MembersClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState({ email: '', role_id: '', first_name: '', last_name: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!active) return;
    setLoading(true);
    Promise.all([membersApi.list(active.id), membersApi.roles(active.id)])
      .then(([m, r]) => {
        setRows(m);
        setRoles(r);
        if (r[0] && !invite.role_id) setInvite((f) => ({ ...f, role_id: r[0].id }));
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [active?.id]);

  const submitInvite = async () => {
    if (!active || !invite.email) return;
    setSubmitting(true);
    try {
      await membersApi.invite(active.id, invite);
      setInvite({ email: '', role_id: roles[0]?.id ?? '', first_name: '', last_name: '' });
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const changeRole = async (member: any, role_id: string) => {
    if (!active) return;
    try {
      await membersApi.update(active.id, member.id, { role_id });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (!active) return <p className='text-sm text-muted-foreground'>Sélectionnez un business.</p>;

  return (
    <div className='space-y-6'>
      {error && <p className='text-sm text-destructive'>Erreur: {error}</p>}
      <div className='rounded-md border p-4 space-y-3'>
        <h3 className='font-medium text-sm'>Inviter un collaborateur</h3>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-3'>
          <Input placeholder='email *' value={invite.email} onChange={(e) => setInvite({ ...invite, email: e.target.value })} />
          <Input placeholder='Prénom' value={invite.first_name} onChange={(e) => setInvite({ ...invite, first_name: e.target.value })} />
          <Input placeholder='Nom' value={invite.last_name} onChange={(e) => setInvite({ ...invite, last_name: e.target.value })} />
          <Select value={invite.role_id} onValueChange={(v) => setInvite({ ...invite, role_id: v })}>
            <SelectTrigger><SelectValue placeholder='Rôle' /></SelectTrigger>
            <SelectContent>{roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.nom}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <Button onClick={submitInvite} disabled={submitting || !invite.email} size='sm'>{submitting ? 'Envoi...' : 'Inviter'}</Button>
      </div>

      {loading ? (
        <p className='text-sm'>Chargement...</p>
      ) : !rows.length ? (
        <p className='text-sm text-muted-foreground'>Aucun membre.</p>
      ) : (
        <div className='rounded-md border divide-y'>
          {rows.map((r: any) => (
            <div key={r.id} className='flex justify-between p-3 text-sm items-center'>
              <span>{r.user?.email ?? r.email} <span className='text-muted-foreground'>({r.statut})</span></span>
              <div className='flex gap-2 items-center'>
                <Select value={r.role?.id ?? ''} onValueChange={(v) => changeRole(r, v)}>
                  <SelectTrigger className='w-32'><SelectValue /></SelectTrigger>
                  <SelectContent>{roles.map((ro) => <SelectItem key={ro.id} value={ro.id}>{ro.nom}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
