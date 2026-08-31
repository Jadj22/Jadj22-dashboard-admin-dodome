import { NavItem } from 'types';

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Catalogue',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: []
  },
  {
    title: 'Catégories',
    url: '/dashboard/categories',
    icon: 'product',
    shortcut: ['c', 'c'],
    isActive: false,
    items: []
  },
  {
    title: 'Stock',
    url: '/dashboard/stock',
    icon: 'billing',
    shortcut: ['s', 's'],
    isActive: false,
    items: []
  },
  {
    title: 'Réservations',
    url: '/dashboard/reservations',
    icon: 'kanban',
    shortcut: ['r', 'r'],
    isActive: false,
    items: []
  },
  {
    title: 'Demandes',
    url: '/dashboard/booking-requests',
    icon: 'dashboard',
    shortcut: ['b', 'b'],
    isActive: false,
    items: []
  },
  {
    title: 'Membres',
    url: '/dashboard/members',
    icon: 'userPen',
    shortcut: ['e', 'e'],
    isActive: false,
    items: []
  },
  {
    title: 'Entretien',
    url: '/dashboard/maintenance',
    icon: 'kanban',
    shortcut: ['m', 'm'],
    isActive: false,
    items: []
  },
  {
    title: 'Facturation',
    url: '/dashboard/invoices',
    icon: 'billing',
    shortcut: ['f', 'f'],
    isActive: false,
    items: []
  },
  {
    title: 'Inventaires',
    url: '/dashboard/inventories',
    icon: 'dashboard',
    shortcut: ['i', 'i'],
    isActive: false,
    items: []
  },
  {
    title: 'Compte & Profil',
    url: '/dashboard/profile',
    icon: 'userPen',
    shortcut: ['p', 'r'],
    isActive: false,
    items: []
  },
  {
    title: 'Kanban',
    url: '/dashboard/kanban',
    icon: 'kanban',
    shortcut: ['k', 'k'],
    isActive: false,
    items: []
  }
];
