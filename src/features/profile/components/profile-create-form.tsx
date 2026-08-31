'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useBusiness } from '@/hooks/use-business';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { authApi } from '@/lib/dodome-api';
import { toast } from 'sonner';

export default function ProfileCreateForm({
  initialData,
  categories
}: {
  initialData?: any;
  categories?: any;
}) {
  const { data: session } = useSession();
  const { active, role, permissions, businesses, setActiveId } = useBusiness();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authApi
      .me()
      .then((res: any) => {
        setUserProfile(res.user);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className='space-y-6'>
      <div>
        <h3 className='text-lg font-medium'>
          Profil Utilisateur & Organisation
        </h3>
        <p className='text-muted-foreground text-sm'>
          Informations de votre compte DODOME et de votre appartenance aux
          espaces de travail.
        </p>
      </div>
      <Separator />

      <div className='grid gap-6 md:grid-cols-2'>
        {/* Informations personnelles */}
        <Card>
          <CardHeader>
            <CardTitle>Compte Utilisateur</CardTitle>
            <CardDescription>Vos identifiants et coordonnées</CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-1'>
              <Label>Email</Label>
              <Input
                value={userProfile?.email || session?.user?.email || ''}
                disabled
              />
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <Label>Prénom</Label>
                <Input
                  value={userProfile?.first_name || ''}
                  placeholder='Non renseigné'
                  disabled
                />
              </div>
              <div className='space-y-1'>
                <Label>Nom</Label>
                <Input
                  value={userProfile?.last_name || ''}
                  placeholder='Non renseigné'
                  disabled
                />
              </div>
            </div>
            <div className='space-y-1'>
              <Label>Téléphone</Label>
              <Input
                value={userProfile?.telephone || ''}
                placeholder='Non renseigné'
                disabled
              />
            </div>
          </CardContent>
        </Card>

        {/* Espace de travail actif */}
        <Card>
          <CardHeader>
            <CardTitle>Business Actif & Rôle RBAC</CardTitle>
            <CardDescription>
              Votre statut dans l'organisation sélectionnée
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-1'>
              <Label>Business Courant</Label>
              <Input
                value={active?.nom || 'Aucun business sélectionné'}
                disabled
              />
            </div>
            <div className='space-y-1'>
              <Label>Type d'activité</Label>
              <Input value={active?.business_type || '-'} disabled />
            </div>
            <div className='space-y-1'>
              <Label>Rôle attribué</Label>
              <div className='flex items-center gap-2'>
                <span className='bg-primary/10 text-primary inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium'>
                  {role?.nom || 'MEMBER'}
                </span>
                {role?.is_system && (
                  <span className='text-muted-foreground text-xs'>
                    (Rôle système)
                  </span>
                )}
              </div>
            </div>
            <div className='space-y-1'>
              <Label>Permissions actives ({permissions.length})</Label>
              <div className='text-muted-foreground flex max-h-28 flex-wrap gap-1 overflow-y-auto rounded-md border p-2 text-xs'>
                {permissions.length > 0 ? (
                  permissions.map((p) => (
                    <span key={p} className='bg-muted rounded px-1.5 py-0.5'>
                      {p}
                    </span>
                  ))
                ) : (
                  <span>Aucune permission spéciale.</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des organisations accessibles */}
      <Card>
        <CardHeader>
          <CardTitle>Mes Espaces de Travail ({businesses.length})</CardTitle>
          <CardDescription>
            Basculez facilement entre vos différents businesses multi-tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {businesses.map((b) => {
              const isCurrent = b.id === active?.id;
              return (
                <div
                  key={b.id}
                  className={`flex items-center justify-between rounded-lg border p-3 ${
                    isCurrent ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <div>
                    <p className='text-sm font-medium'>{b.nom}</p>
                    <p className='text-muted-foreground text-xs'>
                      {b.business_type}
                    </p>
                  </div>
                  {isCurrent ? (
                    <span className='text-primary text-xs font-semibold'>
                      Actif
                    </span>
                  ) : (
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => {
                        setActiveId(b.id);
                        toast.success(`Bascule vers ${b.nom}`);
                      }}
                    >
                      Sélectionner
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
