import { NavItem } from 'types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [] // Empty array as there are no child items for Dashboard
  },
  {
    title: 'Catalogue',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [] // Items = catalogue réel DODOME
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
    title: 'Account',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm']
      },
      {
        title: 'Login',
        shortcut: ['l', 'l'],
        url: '/',
        icon: 'login'
      }
    ]
  },
  {
    title: 'Kanban',
    url: '/dashboard/kanban',
    icon: 'kanban',
    shortcut: ['k', 'k'],
    isActive: false,
    items: [] // No child items
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
