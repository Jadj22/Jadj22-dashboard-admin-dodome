/**
 * Client API réel DODOME — remplace mock-api.ts
 * Django REST @ https://dodome-backend.onrender.com/api
 * Gère JWT (access/refresh), X-Business-ID (RM-01), pagination DRF, refresh auto 401
 */

function getApiBase(): string {
  const raw = (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    'http://localhost:8000/api'
  )
    .trim()
    .replace(/\/+$/, '');
  return raw.endsWith('/api') ? raw : `${raw}/api`;
}

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
  noCache?: boolean;
  cacheTtl?: number; // millisecondes (défaut: 60s)
};

// ─── Cache Intelligent en mémoire & Déduplication de requêtes ───────────────
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class ApiCacheManager {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inFlight = new Map<string, Promise<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttl: number = 60_000): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  getInFlight<T>(key: string): Promise<T> | null {
    return (this.inFlight.get(key) as Promise<T>) || null;
  }

  setInFlight<T>(key: string, promise: Promise<T>): void {
    this.inFlight.set(key, promise);
  }

  deleteInFlight(key: string): void {
    this.inFlight.delete(key);
  }

  invalidate(pattern?: string | RegExp): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    const regex =
      typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

export const apiCache = new ApiCacheManager();

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
  const base = getApiBase();
  const res = await fetch(`${base}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh })
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access: string };
  if (typeof window !== 'undefined')
    localStorage.setItem('dodome_access', data.access);
  return data.access;
}

async function dodomeFetch<T>(path: string, opts: FetchOpts = {}): Promise<T> {
  const isGet = !opts.method || opts.method.toUpperCase() === 'GET';
  const base = getApiBase();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http') ? path : `${base}${cleanPath}`;
  const cacheKey = `${opts.businessId || 'global'}:${url}`;

  // Invalidation automatique du cache lors d'une mutation (POST, PUT, PATCH, DELETE)
  if (!isGet) {
    const match = path.match(
      /\/(items|categories|stock|reservations|invoices|inventories|maintenance|members|businesses|analytics)/i
    );
    if (match) {
      apiCache.invalidate(match[1]);
    } else {
      apiCache.invalidate();
    }
  } else if (!opts.noCache) {
    const cached = apiCache.get<T>(cacheKey);
    if (cached !== null) {
      return cached;
    }
    const inFlight = apiCache.getInFlight<T>(cacheKey);
    if (inFlight !== null) {
      return inFlight;
    }
  }

  const executeFetch = async (): Promise<T> => {
    const isFormData =
      typeof FormData !== 'undefined' && opts.body instanceof FormData;
    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...opts.headers
    };
    if (opts.auth !== false) {
      const token = getAccessToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    if (opts.businessId) headers['X-Business-ID'] = opts.businessId;

    let res: Response;
    try {
      res = await fetch(url, {
        method: opts.method ?? 'GET',
        headers,
        body: isFormData
          ? (opts.body as FormData)
          : opts.body
            ? JSON.stringify(opts.body)
            : undefined
      });
    } catch (err: any) {
      console.warn(
        `[DODOME API] Connexion impossible vers ${url}:`,
        err.message || err
      );
      throw new Error(
        `Impossible de joindre le serveur API (${url}). Vérifiez que le backend est démarré.`
      );
    }

    // Refresh auto sur 401
    if (res.status === 401 && opts.auth !== false) {
      try {
        const newToken = await refreshAccess();
        if (newToken) {
          headers['Authorization'] = `Bearer ${newToken}`;
          res = await fetch(url, {
            method: opts.method ?? 'GET',
            headers,
            body: opts.body ? JSON.stringify(opts.body) : undefined
          });
        }
      } catch (refreshErr) {
        console.warn(
          '[DODOME API] Échec du rafraîchissement du token:',
          refreshErr
        );
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
    const result = (await res.json()) as T;

    if (isGet && !opts.noCache) {
      apiCache.set(cacheKey, result, opts.cacheTtl ?? 60_000);
    }
    return result;
  };

  if (isGet && !opts.noCache) {
    const promise = executeFetch().finally(() => {
      apiCache.deleteInFlight(cacheKey);
    });
    apiCache.setInFlight(cacheKey, promise);
    return promise;
  }

  return executeFetch();
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
  me: () => dodomeFetch('/auth/me/')
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
export type BusinessContext = {
  business: Business;
  membership: { id: string; statut: string };
  role: { id: string; nom: string; is_system: boolean } | null;
  permissions: string[];
};

export const businessApi = {
  list: async (): Promise<Business[]> => {
    try {
      const res = await dodomeFetch<any>('/businesses/');
      const list = Array.isArray(res) ? res : (res?.results ?? []);
      if (list && list.length > 0) return list;
    } catch (e) {
      console.warn('[DODOME] /businesses/ échoué, essai via /auth/me/:', e);
    }
    try {
      const me = await authApi.me();
      if (me && me.businesses && me.businesses.length > 0) {
        return me.businesses as Business[];
      }
    } catch (e) {
      console.warn('[DODOME] /auth/me/ échoué:', e);
    }
    return [];
  },
  get: (id: string) => dodomeFetch<Business>(`/businesses/${id}/`),
  current: (businessId: string) =>
    dodomeFetch<BusinessContext>(`/businesses/current/context/`, {
      businessId
    }),
  create: (data: { nom: string; business_type?: string }) =>
    dodomeFetch<Business>('/businesses/', {
      method: 'POST',
      body: data as Record<string, unknown>
    })
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
      create: (
        businessId: string,
        data: {
          nom: string;
          description?: string;
          parent_id?: string | null;
          image?: File | null;
        }
      ) => {
        if (data.image) {
          const fd = new FormData();
          fd.append('nom', data.nom);
          if (data.description) fd.append('description', data.description);
          if (data.parent_id) fd.append('parent_id', data.parent_id);
          fd.append('image', data.image);
          return dodomeFetch<Category>(
            `/businesses/${businessId}/categories/`,
            {
              method: 'POST',
              body: fd,
              businessId
            }
          );
        }
        return dodomeFetch<Category>(`/businesses/${businessId}/categories/`, {
          method: 'POST',
          body: {
            nom: data.nom,
            description: data.description,
            parent_id: data.parent_id
          } as unknown as Record<string, unknown>,
          businessId
        });
      },
      remove: (businessId: string, categoryId: string) =>
        dodomeFetch<void>(
          `/businesses/${businessId}/categories/${categoryId}/`,
          {
            method: 'DELETE',
            businessId
          }
        )
    }
  ),

  items: Object.assign(
    (
      businessId: string,
      opts?: {
        page?: number;
        limit?: number;
        search?: string;
        category_id?: string;
      }
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
    {
      get: (businessId: string, itemId: string) =>
        dodomeFetch<Item>(`/businesses/${businessId}/items/${itemId}/`, {
          businessId
        }),
      create: (
        businessId: string,
        data: Partial<Item> & Record<string, unknown>
      ) =>
        dodomeFetch<Item>(`/businesses/${businessId}/items/`, {
          method: 'POST',
          body: data,
          businessId
        }),
      update: (
        businessId: string,
        itemId: string,
        data: Partial<Item> & Record<string, unknown>
      ) =>
        dodomeFetch<Item>(`/businesses/${businessId}/items/${itemId}/`, {
          method: 'PATCH',
          body: data,
          businessId
        }),
      remove: (businessId: string, itemId: string) =>
        dodomeFetch<void>(`/businesses/${businessId}/items/${itemId}/`, {
          method: 'DELETE',
          businessId
        }),
      uploadPhoto: (
        businessId: string,
        itemId: string,
        file: File,
        caption?: string
      ) => {
        const fd = new FormData();
        fd.append('image', file);
        if (caption) fd.append('caption', caption);
        return dodomeFetch<{ id: string; image: string; caption?: string }>(
          `/businesses/${businessId}/items/${itemId}/photos/`,
          {
            method: 'POST',
            body: fd,
            businessId
          }
        );
      },
      deletePhoto: (businessId: string, itemId: string, photoId: string) =>
        dodomeFetch<void>(
          `/businesses/${businessId}/items/${itemId}/photos/${photoId}/`,
          {
            method: 'DELETE',
            businessId
          }
        )
    }
  ),

  stock: (businessId: string) =>
    dodomeFetch<Paginated<unknown>>(`/businesses/${businessId}/stock/`, {
      businessId
    })
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
    data: {
      item_id: string;
      type: StockMovement['type'];
      quantite: number;
      motif: string;
    }
  ) =>
    dodomeFetch<StockMovement>(`/businesses/${businessId}/stock/movements/`, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
      businessId
    }),
  history: (businessId: string, itemId: string) =>
    dodomeFetch<Paginated<StockMovement>>(
      `/businesses/${businessId}/items/${itemId}/stock/history/`,
      { businessId }
    )
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
  list: (
    businessId: string,
    opts?: { page?: number; limit?: number; statut?: string }
  ) => {
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
    data: {
      item_id: string;
      date_debut: string;
      date_fin: string;
      quantite?: number;
      motif?: string;
    }
  ) =>
    dodomeFetch<Reservation>(`/businesses/${businessId}/reservations/`, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
      businessId
    }),
  bulk: (
    businessId: string,
    data: {
      items: { item_id: string; quantite: number }[];
      date_debut: string;
      date_fin: string;
      motif?: string;
    }
  ) =>
    dodomeFetch<Reservation[]>(`/businesses/${businessId}/reservations/bulk/`, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
      businessId
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
      terminer: 'terminer'
    };
    return dodomeFetch<Reservation>(
      `/businesses/${businessId}/reservations/${reservationId}/${map[action]}/`,
      { method: 'POST', body, businessId }
    );
  }
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
  list: (
    businessId: string,
    opts?: { page?: number; limit?: number; statut?: string }
  ) => {
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
    )
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
      businessId
    }).then((d) => d.results),
  invite: (
    businessId: string,
    data: {
      email: string;
      role_id?: string;
      first_name?: string;
      last_name?: string;
    }
  ) =>
    dodomeFetch<Member>(`/businesses/${businessId}/members/`, {
      method: 'POST',
      body: data as unknown as Record<string, unknown>,
      businessId
    }),
  update: (
    businessId: string,
    memberId: string,
    data: { role_id?: string; statut?: string }
  ) =>
    dodomeFetch<Member>(`/businesses/${businessId}/members/${memberId}/`, {
      method: 'PATCH',
      body: data as unknown as Record<string, unknown>,
      businessId
    }),
  remove: (businessId: string, memberId: string) =>
    dodomeFetch<void>(`/businesses/${businessId}/members/${memberId}/`, {
      method: 'DELETE',
      businessId
    }),
  roles: (businessId: string) =>
    dodomeFetch<Paginated<Role>>(`/businesses/${businessId}/roles/`, {
      businessId
    }).then((d) => d.results)
};

// ─── Entretien (procédures & tâches) ──────────────────────────────────────
export type Procedure = {
  id: string;
  nom: string;
  description: string;
  est_actif: boolean;
  steps: {
    id: string;
    nom: string;
    ordre: number;
    obligatoire: boolean;
    type: string;
  }[];
};

export const maintenanceApi = {
  procedures: {
    list: (businessId: string) =>
      dodomeFetch<Paginated<Procedure>>(
        `/businesses/${businessId}/procedures/`,
        { businessId }
      ).then((d) => d.results),
    create: (
      businessId: string,
      data: { nom: string; description?: string; steps_input?: any[] }
    ) =>
      dodomeFetch<Procedure>(`/businesses/${businessId}/procedures/`, {
        method: 'POST',
        body: data as any,
        businessId
      })
  },
  tasks: {
    list: (
      businessId: string,
      opts?: { page?: number; limit?: number; statut?: string }
    ) => {
      const p = new URLSearchParams();
      if (opts?.page) p.set('page', String(opts.page));
      if (opts?.limit) p.set('page_size', String(opts.limit));
      if (opts?.statut) p.set('statut', opts.statut);
      const qs = p.toString() ? `?${p.toString()}` : '';
      return dodomeFetch<Paginated<any>>(
        `/businesses/${businessId}/maintenance/tasks/${qs}`,
        { businessId }
      );
    },
    create: (
      businessId: string,
      data: { item_id: string; procedure_id?: string; motif?: string }
    ) =>
      dodomeFetch<any>(`/businesses/${businessId}/maintenance/tasks/`, {
        method: 'POST',
        body: data as any,
        businessId
      }),
    cloture: (businessId: string, taskId: string, partielle?: boolean) =>
      dodomeFetch<any>(
        `/businesses/${businessId}/maintenance/tasks/${taskId}/cloturer/`,
        {
          method: 'POST',
          body: partielle ? { partielle: true } : {},
          businessId
        }
      )
  }
};

// ─── Invoices & Inventaires ─────────────────────────────────────────────
export const invoiceApi = {
  list: (businessId: string) =>
    dodomeFetch<Paginated<any>>(`/businesses/${businessId}/invoices/`, {
      businessId
    }).then((d) => d.results),
  create: (
    businessId: string,
    data: { reservation_id: string; type?: string; tva_taux?: number }
  ) =>
    dodomeFetch<any>(`/businesses/${businessId}/invoices/`, {
      method: 'POST',
      body: data as any,
      businessId
    }),
  markSent: (businessId: string, id: string) =>
    dodomeFetch<any>(`/businesses/${businessId}/invoices/${id}/mark-sent/`, {
      method: 'POST',
      businessId
    }),
  markPaid: (businessId: string, id: string) =>
    dodomeFetch<any>(`/businesses/${businessId}/invoices/${id}/mark-paid/`, {
      method: 'POST',
      businessId
    })
};

export const inventoryApi = {
  list: (businessId: string) =>
    dodomeFetch<Paginated<any>>(`/businesses/${businessId}/inventories/`, {
      businessId
    }).then((d) => d.results),
  create: (businessId: string, data: { libelle: string }) =>
    dodomeFetch<any>(`/businesses/${businessId}/inventories/`, {
      method: 'POST',
      body: data as any,
      businessId
    }),
  cloture: (businessId: string, id: string) =>
    dodomeFetch<any>(`/businesses/${businessId}/inventories/${id}/cloturer/`, {
      method: 'POST',
      businessId
    })
};

// ─── Analytics / Dashboard (admin) ──────────────────────────────────────
export const analyticsApi = {
  dashboard: (businessId: string) =>
    dodomeFetch<unknown>(`/businesses/${businessId}/dashboard/`, {
      businessId
    }),
  analytics: (businessId: string) =>
    dodomeFetch<unknown>(`/businesses/${businessId}/analytics/`, {
      businessId
    }),
  activities: (businessId: string) =>
    dodomeFetch<Paginated<unknown>>(`/businesses/${businessId}/activities/`, {
      businessId
    })
};
