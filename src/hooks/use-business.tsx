'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback
} from 'react';
import { businessApi, type Business } from '@/lib/dodome-api';
import { useSession } from 'next-auth/react';

export type BusinessRole = {
  id: string;
  nom: string;
  is_system: boolean;
};

export type BusinessMembership = {
  id: string;
  statut: string;
};

export type BusinessContextType = {
  businesses: Business[];
  currentBusiness: Business | null;
  active: Business | null;
  activeId: string | null;
  currentBusinessId: string | null;
  membership: BusinessMembership | null;
  role: BusinessRole | null;
  permissions: string[];
  setActiveId: (id: string) => void;
  loading: boolean;
  refetchContext: () => Promise<void>;
};

const BusinessContext = createContext<BusinessContextType>({
  businesses: [],
  currentBusiness: null,
  active: null,
  activeId: null,
  currentBusinessId: null,
  membership: null,
  role: null,
  permissions: [],
  setActiveId: () => {},
  loading: true,
  refetchContext: async () => {}
});

export function BusinessProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined')
      return localStorage.getItem('dodome_business_id');
    return null;
  });
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [membership, setMembership] = useState<BusinessMembership | null>(null);
  const [role, setRole] = useState<BusinessRole | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Charger la liste des businesses
  const loadBusinesses = useCallback(async () => {
    try {
      setLoading(true);
      const list = await businessApi.list();
      setBusinesses(list || []);

      const storedId =
        typeof window !== 'undefined'
          ? localStorage.getItem('dodome_business_id')
          : null;
      if (storedId && list && list.some((b) => b.id === storedId)) {
        setActiveIdState(storedId);
      } else if (list && list.length > 0) {
        const firstId = list[0].id;
        setActiveIdState(firstId);
        if (typeof window !== 'undefined')
          localStorage.setItem('dodome_business_id', firstId);
      } else {
        setActiveIdState(null);
        if (typeof window !== 'undefined')
          localStorage.removeItem('dodome_business_id');
      }
    } catch (err) {
      console.warn('[DODOME] Chargement businesses non disponible:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Synchronisation session -> localStorage -> loadBusinesses
  useEffect(() => {
    if (status === 'authenticated') {
      const access = session?.accessToken as string | undefined;
      const refresh = session?.refreshToken as string | undefined;
      if (access && typeof window !== 'undefined') {
        localStorage.setItem('dodome_access', access);
      }
      if (refresh && typeof window !== 'undefined') {
        localStorage.setItem('dodome_refresh', refresh);
      }
      loadBusinesses();
    } else if (status === 'unauthenticated') {
      setBusinesses([]);
      setCurrentBusiness(null);
      setLoading(false);
    }
  }, [session, status, loadBusinesses]);

  // 2. Résoudre le contexte RBAC complet du business actif (X-Business-ID)
  const loadContext = useCallback(async () => {
    if (!activeId) {
      setCurrentBusiness(null);
      setMembership(null);
      setRole(null);
      setPermissions([]);
      return;
    }

    try {
      const ctx = await businessApi.current(activeId);
      setCurrentBusiness(ctx.business);
      setMembership(ctx.membership);
      setRole(ctx.role);
      setPermissions(ctx.permissions || []);
    } catch (err) {
      console.warn(
        '[DODOME] Contexte business inaccessible pour ID:',
        activeId
      );
      const found = businesses.find((b) => b.id === activeId) ?? null;
      setCurrentBusiness(found);
    }
  }, [activeId, businesses]);

  useEffect(() => {
    if (activeId) {
      loadContext();
    }
  }, [activeId, loadContext]);

  const setActiveId = (id: string) => {
    setActiveIdState(id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dodome_business_id', id);
    }
    // Recharger la page pour rafraîchir tous les composants et requêtes API avec le nouveau X-Business-ID
    window.location.reload();
  };

  const active =
    currentBusiness ??
    businesses.find((b) => b.id === activeId) ??
    (businesses.length > 0 ? businesses[0] : null);

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        currentBusiness: active,
        active,
        activeId,
        currentBusinessId: activeId,
        membership,
        role,
        permissions,
        setActiveId,
        loading,
        refetchContext: loadContext
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  return useContext(BusinessContext);
}
