'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { User, Receipt, LogOut } from 'lucide-react';

export function UserNav() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) return null;

  const initials = session.user?.name
    ? session.user.name.slice(0, 2).toUpperCase()
    : 'DO';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage
              src={session.user?.image ?? ''}
              alt={session.user?.name ?? ''}
            />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm leading-none font-medium'>
              {session.user?.name || 'Utilisateur'}
            </p>
            <p className='text-muted-foreground text-xs leading-none'>
              {session.user?.email || ''}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            className='cursor-pointer gap-2'
            onClick={() => router.push('/dashboard/profile')}
          >
            <User className='h-4 w-4' />
            Mon Compte & Profil
          </DropdownMenuItem>
          <DropdownMenuItem
            className='cursor-pointer gap-2'
            onClick={() => router.push('/dashboard/invoices')}
          >
            <Receipt className='h-4 w-4' />
            Facturation
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='text-destructive focus:text-destructive cursor-pointer gap-2'
          onClick={() => signOut({ callbackUrl: '/' })}
        >
          <LogOut className='h-4 w-4' />
          Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
