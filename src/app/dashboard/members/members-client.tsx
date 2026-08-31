'use client';

import { useBusiness } from '@/hooks/use-business';
import { membersApi, apiCache } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RefreshCw, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function MembersClient() {
  const { active } = useBusiness();
  const [rows, setRows] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState({
    email: '',
    role_id: '',
    first_name: '',
    last_name: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    if (!active) return;
    setLoading(true);
    Promise.all([membersApi.list(active.id), membersApi.roles(active.id)])
      .then(([m, r]) => {
        setRows(m || []);
        setRoles(r || []);
        if (r && r[0] && !invite.role_id)
          setInvite((f) => ({ ...f, role_id: r[0].id }));
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    load();
  }, [active?.id]);

  const handleRefresh = () => {
    setRefreshing(true);
    apiCache.invalidate('members');
    load();
    toast.success('Membres et rôles actualisés');
  };

  const submitInvite = async () => {
    if (!active || !invite.email.trim()) return;
    setSubmitting(true);
    try {
      await membersApi.invite(active.id, invite);
      toast.success(`Invitation envoyée à ${invite.email}`);
      setInvite({
        email: '',
        role_id: roles[0]?.id ?? '',
        first_name: '',
        last_name: ''
      });
      load();
    } catch (e: any) {
      setError(e.message);
      toast.error("Erreur lors de l'envoi de l'invitation");
    } finally {
      setSubmitting(false);
    }
  };

  const changeRole = async (member: any, role_id: string) => {
    if (!active) return;
    try {
      await membersApi.update(active.id, member.id, { role_id });
      toast.success('Rôle mis à jour');
      load();
    } catch (e: any) {
      setError(e.message);
      toast.error('Impossible de modifier le rôle');
    }
  };

  if (!active)
    return (
      <p className='text-muted-foreground text-sm'>Sélectionnez un business.</p>
    );

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <h3 className='flex items-center gap-2 text-lg font-semibold'>
          <Users className='h-5 w-5' /> Équipe & Collaborateurs
        </h3>
        <Button
          variant='outline'
          size='sm'
          className='gap-1.5'
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
          />
          Actualiser
        </Button>
      </div>

      {error && <p className='text-destructive text-sm'>Erreur: {error}</p>}

      <div className='bg-card space-y-3 rounded-lg border p-4'>
        <h4 className='flex items-center gap-1.5 text-sm font-medium'>
          <UserPlus className='text-primary h-4 w-4' /> Inviter un collaborateur
        </h4>
        <div className='grid grid-cols-1 gap-3 md:grid-cols-4'>
          <Input
            placeholder='Email *'
            value={invite.email}
            onChange={(e) => setInvite({ ...invite, email: e.target.value })}
          />
          <Input
            placeholder='Prénom'
            value={invite.first_name}
            onChange={(e) =>
              setInvite({ ...invite, first_name: e.target.value })
            }
          />
          <Input
            placeholder='Nom'
            value={invite.last_name}
            onChange={(e) =>
              setInvite({ ...invite, last_name: e.target.value })
            }
          />
          <Select
            value={invite.role_id}
            onValueChange={(v) => setInvite({ ...invite, role_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder='Rôle' />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={submitInvite}
          disabled={submitting || !invite.email.trim()}
          size='sm'
        >
          {submitting ? 'Envoi en cours...' : 'Envoyer l’invitation'}
        </Button>
      </div>

      {loading ? (
        <p className='text-muted-foreground text-sm'>
          Chargement des membres...
        </p>
      ) : !rows.length ? (
        <p className='text-muted-foreground rounded-lg border p-8 text-center text-sm'>
          Aucun membre trouvé.
        </p>
      ) : (
        <div className='bg-card divide-y rounded-lg border'>
          {rows.map((r: any) => (
            <div
              key={r.id}
              className='flex items-center justify-between p-4 text-sm'
            >
              <div>
                <p className='font-medium'>
                  {r.user?.first_name
                    ? `${r.user.first_name} ${r.user.last_name || ''}`
                    : (r.user?.email ?? r.email)}
                </p>
                <p className='text-muted-foreground text-xs'>
                  {r.user?.email ?? r.email} — Statut :{' '}
                  <span className='font-semibold'>{r.statut}</span>
                </p>
              </div>
              <div className='flex items-center gap-2'>
                <Select
                  value={r.role?.id ?? ''}
                  onValueChange={(v) => changeRole(r, v)}
                >
                  <SelectTrigger className='w-36'>
                    <SelectValue placeholder='Rôle' />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((ro) => (
                      <SelectItem key={ro.id} value={ro.id}>
                        {ro.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
