'use client';

import * as React from 'react';
import { Building2, ChevronsUpDown, Plus } from 'lucide-react';
import { useBusiness } from '@/hooks/use-business';
import { useRouter } from 'next/navigation';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';

export function TeamSwitcher({
  teams
}: {
  teams: { name: string; logo: React.ElementType; plan: string }[];
}) {
  const { isMobile } = useSidebar();
  const { businesses, active, setActiveId, loading } = useBusiness();
  const router = useRouter();

  // Fallback mock si pas de business (non connecté ou API down)
  const displayTeams = businesses.length
    ? businesses.map((b) => ({ name: b.nom, logo: Building2, plan: b.business_type, id: b.id }))
    : teams.map((t) => ({ ...t, id: t.name }));

  const activeTeam =
    (active
      ? { name: active.nom, logo: Building2, plan: active.business_type }
      : null) ?? teams[0];

  if (loading && businesses.length === 0) {
    // skeleton léger
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size='lg' disabled>
            <div className='bg-muted flex aspect-square size-8 items-center justify-center rounded-lg' />
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-semibold'>Chargement...</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <div className='bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                <activeTeam.logo className='size-4' />
              </div>
              <div className='grid flex-1 text-left text-sm leading-tight'>
                <span className='truncate font-semibold'>{activeTeam.name}</span>
                <span className='truncate text-xs'>{activeTeam.plan}</span>
              </div>
              <ChevronsUpDown className='ml-auto' />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className='text-muted-foreground text-xs'>
              {businesses.length ? 'Businesses' : 'Teams'}
            </DropdownMenuLabel>
            {displayTeams.map((team: any, index: number) => (
              <DropdownMenuItem
                key={team.id ?? team.name}
                onClick={() => {
                  if (team.id && businesses.find((b) => b.id === team.id)) {
                    setActiveId(team.id);
                  }
                }}
                className='gap-2 p-2'
              >
                <div className='flex size-6 items-center justify-center rounded-sm border'>
                  <team.logo className='size-4 shrink-0' />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className='gap-2 p-2' onClick={() => router.push('/dashboard/business/new')}>
              <div className='bg-background flex size-6 items-center justify-center rounded-md border'>
                <Plus className='size-4' />
              </div>
              <div className='text-muted-foreground font-medium'>Add business</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
