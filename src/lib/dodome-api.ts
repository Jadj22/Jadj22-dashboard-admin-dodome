/**
 * Client API réel DODOME — remplace mock-api.ts
 * Django REST @ https://dodome-backend.onrender.com/api
 * Gère JWT (access/refresh), X-Business-ID (RM-01), pagination DRF, refresh auto 401
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api';

// Types paginés DRF
export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

type FetchOpts = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  businessId?: string;
  auth?: boolean; // false pour /auth/*
};

// Helpers token (stockés en httpOnly cookie via next-auth, mais aussi localStorage côté client)
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dodome_access');
}
function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('dodome_refresh');
}

async function refreshAccess(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const res = await fetch(`${API_BASE}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access: string };
  if (typeof window !== 'undefined')
    localStorage.setItem('dodome_access', data.access);
  return data.access;
}

async function dodomeFetch<T>(
  path: string,
  opts: FetchOpts = {}
): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...opts.headers,
  };
  if (opts.auth !== false) {
    const token = getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  if (opts.businessId) headers['X-Business-ID'] = opts.businessId;

  let res = await fetch(url, {
    method: opts.method ?? 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  // Refresh auto sur 401
  if (res.status === 401 && opts.auth !== false) {
    const newToken = await refreshAccess();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      res = await fetch(url, {
        method: opts.method ?? 'GET',
        headers,
        body: opts.body ? JSON.stringify(opts.body) : undefined,
      });
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let msg = text;
    try {
      const j = JSON.parse(text);
      msg = j.detail ?? j.message ?? text;
    } catch {}
    throw new Error(`API ${res.status}: ${msg || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Auth ───────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    dodomeFetch<{ access: string; refresh: string; user: unknown }>(
      '/auth/login/',
      { method: 'POST', body: { email, password }, auth: false }
    ),
  register: (data: Record<string, unknown>) =>
    dodomeFetch('/auth/register/', { method: 'POST', body: data, auth: false }),
  me: () => dodomeFetch('/auth/me/'),
};

// ─── Types DODOME ───────────────────────────────────────────────────────
export type Business = {
  id: string;
  nom: string;
  slug: string;
  business_type: string;
  adresse: string;
  telephone: string;
  email: string;
  logoUrl?: string;
  created_at: string;
};

export type Category = {
  id: string;
  nom: string;
  description: string;
  parent_id: string | null;
  item_count: number;
  image: string | null;
  image_url: string | null;
};

export type Item = {
  id: string;
  nom: string;
  reference: string | null;
  description: string;
  prix: string;
  unite: string;
  statut: 'ACTIF' | 'INACTIF';
  is_published: boolean;
  category: { id: string; nom: string } | null;
  photos: { id: string; image: string }[];
  created_at: string;
};

// ─── Business ───────────────────────────────────────────────────────────
export const businessApi = {
  list: () => dodomeFetch<Paginated<Business>>('/businesses/').then((d) => d.results),
  // le starter attendait aussi /businesses mais la vraie API est paginée
  get: (id: string) => dodomeFetch<Business>(`/businesses/${id}/`),
};

// ─── Catalogue ──────────────────────────────────────────────────────────
export const catalogApi = {
  categories: Object.assign(
    (businessId: string) =>
      dodomeFetch<Paginated<Category>>(
        `/businesses/${businessId}/categories/`,
        { businessId }
      ).then((d) => d.results),
    {
      create: (businessId: string, data: { nom: string; description?: string; parent_id?: string | null }) =>
        dodomeFetch<Category>(`/businesses/${businessId}/categories/`, {
          method: 'POST',
          body: data as unknown as Record<string, unknown>,
          businessId,
        }),
      remove: (businessId: string, categoryId: string) =>
        dodomeFetch<void>(`/businesses/${businessId}/categories/${categoryId}/`, {
          method: 'DELETE',
          businessId,
        }),
    }
  ),

  items: (
    businessId: string,
    opts?: { page?: number; limit?: number; search?: string; category_id?: string }
  ) => {
    const p = new URLSearchParams();
    if (opts?.page) p.set('page', String(opts.page));
    if (opts?.limit) p.set('page_size', String(opts.limit));
    if (opts?.search) p.set('search', opts.search);
    if (opts?.category_id) p.set('category_id', opts.category_id);
    const qs = p.toString() ? `?${p.toString()}` : '';
    return dodomeFetch<Paginated<Item>>(
      `/businesses/${businessId}/items/${qs}`,
      { businessId }
    );
  },

  stock: (businessId: string) =>
    dodomeFetch<Paginated<unknown>>(`/businesses/${businessId}/stock/`, {
      businessId,
    }),
};

// ─── Stock ──────────────────────────────────────────────────────────────
export type StockMovement = {
  id: string;
  type: 'ENTREE' | 'SORTIE' | 'RETOUR' | 'PERTE' | 'DOMMAGE';
  quantite: number;
  motif: string;
  item_id: string;
  item_nom?: string;
  date: string;
};

export const stockApi = {
  list: (businessId: string, opts?: { page?: number; limit?: number }) => {
    const p = new URLSearchParams();
    if (opts?.page) p.set('page', String(opts.page));
    if (opts?.limit) p.set('page_size', String(opts.limit));
    const qs = p.toString() ? `?${p.toString()}` : '';
    return dodomeFetch<Paginated<StockMovement>>(
      `/businesses/${businessId}/stock/${qs}`,
      { businessId }
    );
  },
  movements: (businessId: string, opts?: { page?: number; limit?: number }) =>
    dodomeFetch<Paginated<StockMovement>>(
      `/businesses/${businessId}/stock/movements/${opts?.page ? `?page=${opts.page}` : ''}`,
      { businessId }
    ),
  create: (
    businessId: string,
    data: { item_id: string; type: StockMovement['type']; quantite: number; motif: string }
  ) =>
    dodomeFetch<StockMovement>(`/businesses/${businessId}/stock/movements/`, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
      businessId,
    }),
  history: (businessId: string, itemId: string) =>
    dodomeFetch<Paginated<StockMovement>>(
      `/businesses/${businessId}/items/${itemId}/stock/history/`,
      { businessId }
    ),
};

// ─── Réservations ─────────────────────────────────────────────────────────
export type Reservation = {
  id: string;
  item_id: string;
  item_nom: string;
  quantite: number;
  date_debut: string;
  date_fin: string;
  statut: 'EN_ATTENTE' | 'VALIDEE' | 'EN_COURS' | 'TERMINEE' | 'ANNULEE';
  motif?: string;
};

export const reservationApi = {
  list: (businessId: string, opts?: { page?: number; limit?: number; statut?: string }) => {
    const p = new URLSearchParams();
    if (opts?.page) p.set('page', String(opts.page));
    if (opts?.limit) p.set('page_size', String(opts.limit));
    if (opts?.statut) p.set('statut', opts.statut);
    const qs = p.toString() ? `?${p.toString()}` : '';
    return dodomeFetch<Paginated<Reservation>>(
      `/businesses/${businessId}/reservations/${qs}`,
      { businessId }
    );
  },
  create: (
    businessId: string,
    data: { item_id: string; date_debut: string; date_fin: string; quantite?: number; motif?: string }
  ) =>
    dodomeFetch<Reservation>(`/businesses/${businessId}/reservations/`, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
      businessId,
    }),
  bulk: (
    businessId: string,
    data: { items: { item_id: string; quantite: number }[]; date_debut: string; date_fin: string; motif?: string }
  ) =>
    dodomeFetch<Reservation[]>(`/businesses/${businessId}/reservations/bulk/`, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
      businessId,
    }),
  action: (
    businessId: string,
    reservationId: string,
    action: 'valider' | 'annuler' | 'demarrer' | 'terminer',
    body?: Record<string, unknown>
  ) => {
    const map: Record<string, string> = {
      valider: 'valider',
      annuler: 'annuler',
      demarrer: 'demarrer',
      terminer: 'terminer',
    };
    return dodomeFetch<Reservation>(
      `/businesses/${businessId}/reservations/${reservationId}/${map[action]}/`,
      { method: 'POST', body, businessId }
    );
  },
};

// ─── Booking Requests (demandes publiques) ────────────────────────────────
export type BookingRequest = {
  id: string;
  item_id: string;
  item_nom: string;
  client_nom: string;
  client_email: string;
  date_debut: string;
  date_fin: string;
  quantite: number;
  statut: string;
  statut_display?: string;
};

export const bookingRequestApi = {
  list: (businessId: string, opts?: { page?: number; limit?: number; statut?: string }) => {
    const p = new URLSearchParams();
    if (opts?.page) p.set('page', String(opts.page));
    if (opts?.limit) p.set('page_size', String(opts.limit));
    if (opts?.statut) p.set('statut', opts.statut);
    const qs = p.toString() ? `?${p.toString()}` : '';
    return dodomeFetch<Paginated<BookingRequest>>(
      `/businesses/${businessId}/booking-requests/${qs}`,
      { businessId }
    );
  },
  action: (
    businessId: string,
    requestId: string,
    action: 'accepter' | 'refuser' | 'contre_proposer',
    data?: Record<string, unknown>
  ) =>
    dodomeFetch<{ success: boolean; message: string }>(
      `/businesses/${businessId}/booking-requests/${requestId}/action/`,
      { method: 'POST', body: { action, ...data }, businessId }
    ),
};

// ─── Membres & RBAC ───────────────────────────────────────────────────────
export type Member = {
  id: string;
  user: { id: string; email: string; first_name?: string; last_name?: string };
  role: { id: string; nom: string } | null;
  statut: string;
};

export type Role = {
  id: string;
  nom: string;
  description: string;
  is_system: boolean;
  permissions: { codename: string; libelle: string }[];
};

export const membersApi = {
  list: (businessId: string) =>
    dodomeFetch<Paginated<Member>>(`/businesses/${businessId}/members/`, {
      businessId,
    }).then((d) => d.results),
  invite: (
    businessId: string,
    data: { email: string; role_id?: string; first_name?: string; last_name?: string }
  ) =>
    dodomeFetch<Member>(`/businesses/${businessId}/members/`, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
      businessId,
    }),
  update: (
    businessId: string,
    memberId: string,
    data: { role_id?: string; statut?: string }
  ) =>
    dodomeFetch<Member>(`/businesses/${businessId}/members/${memberId}/`, {
      method: 'PATCH',
      body: data as unknown as Record<string, unknown>,
      businessId,
    }),
  remove: (businessId: string, memberId: string) =>
    dodomeFetch<void>(`/businesses/${businessId}/members/${memberId}/`, {
      method: 'DELETE',
      businessId,
    }),
  roles: (businessId: string) =>
    dodomeFetch<Paginated<Role>>(`/businesses/${businessId}/roles/`, {
      businessId,
    }).then((d) => d.results),
};

// ─── Entretien (procédures & tâches) ──────────────────────────────────────
export type Procedure = {
  id: string;
  nom: string;
  description: string;
  est_actif: boolean;
  steps: { id: string; nom: string; ordre: number; obligatoire: boolean; type: string }[];
};

export const maintenanceApi = {
  procedures: {
    list: (businessId: string) =>
      dodomeFetch<Paginated<Procedure>>(`/businesses/${businessId}/procedures/`, { businessId }).then((d) => d.results),
    create: (businessId: string, data: { nom: string; description?: string; steps_input?: any[] }) =>
      dodomeFetch<Procedure>(`/businesses/${businessId}/procedures/`, { method: 'POST', body: data as any, businessId }),
  },
  tasks: {
    list: (businessId: string, opts?: { page?: number; limit?: number; statut?: string }) => {
      const p = new URLSearchParams();
      if (opts?.page) p.set('page', String(opts.page));
      if (opts?.limit) p.set('page_size', String(opts.limit));
      if (opts?.statut) p.set('statut', opts.statut);
      const qs = p.toString() ? `?${p.toString()}` : '';
      return dodomeFetch<Paginated<any>>(`/businesses/${businessId}/maintenance/tasks/${qs}`, { businessId });
    },
    create: (businessId: string, data: { item_id: string; procedure_id?: string; motif?: string }) =>
      dodomeFetch<any>(`/businesses/${businessId}/maintenance/tasks/`, { method: 'POST', body: data as any, businessId }),
    cloture: (businessId: string, taskId: string, partielle?: boolean) =>
      dodomeFetch<any>(`/businesses/${businessId}/maintenance/tasks/${taskId}/cloturer/`, {
        method: 'POST',
        body: partielle ? { partielle: true } : {},
        businessId,
      }),
  },
};

// ─── Invoices & Inventaires ─────────────────────────────────────────────
export const invoiceApi = {
  list: (businessId: string) =>
    dodomeFetch<Paginated<any>>(`/businesses/${businessId}/invoices/`, { businessId }).then((d) => d.results),
  create: (businessId: string, data: { reservation_id: string; type?: string; tva_taux?: number }) =>
    dodomeFetch<any>(`/businesses/${businessId}/invoices/`, { method: 'POST', body: data as any, businessId }),
  markSent: (businessId: string, id: string) =>
    dodomeFetch<any>(`/businesses/${businessId}/invoices/${id}/mark-sent/`, { method: 'POST', businessId }),
  markPaid: (businessId: string, id: string) =>
    dodomeFetch<any>(`/businesses/${businessId}/invoices/${id}/mark-paid/`, { method: 'POST', businessId }),
};

export const inventoryApi = {
  list: (businessId: string) =>
    dodomeFetch<Paginated<any>>(`/businesses/${businessId}/inventories/`, { businessId }).then((d) => d.results),
  create: (businessId: string, data: { libelle: string }) =>
    dodomeFetch<any>(`/businesses/${businessId}/inventories/`, { method: 'POST', body: data as any, businessId }),
  cloture: (businessId: string, id: string) =>
    dodomeFetch<any>(`/businesses/${businessId}/inventories/${id}/cloturer/`, { method: 'POST', businessId }),
};

// ─── Analytics / Dashboard (admin) ──────────────────────────────────────
export const analyticsApi = {
  dashboard: (businessId: string) =>
    dodomeFetch<unknown>(`/businesses/${businessId}/dashboard/`, {
      businessId,
    }),
  analytics: (businessId: string) =>
    dodomeFetch<unknown>(`/businesses/${businessId}/analytics/`, { businessId }),
  activities: (businessId: string) =>
    dodomeFetch<Paginated<unknown>>(`/businesses/${businessId}/activities/`, {
      businessId,
    }),
};
