'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { businessApi, type Business } from '@/lib/dodome-api';

type BusinessContextType = {
  businesses: Business[];
  active: Business | null;
  setActiveId: (id: string) => void;
  loading: boolean;
};

const BusinessContext = createContext<BusinessContextType>({
  businesses: [],
  active: null,
  setActiveId: () => {},
  loading: true,
});

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [activeId, setActiveId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('dodome_business_id');
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    businessApi
      .list()
      .then((list) => {
        setBusinesses(list);
        if (list.length && !activeId) {
          const first = list[0].id;
          setActiveId(first);
          localStorage.setItem('dodome_business_id', first);
        } else if (activeId && !list.find((b) => b.id === activeId)) {
          // business supprimé
          const first = list[0]?.id ?? null;
          setActiveId(first);
          if (first) localStorage.setItem('dodome_business_id', first);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActive = (id: string) => {
    setActiveId(id);
    if (typeof window !== 'undefined') localStorage.setItem('dodome_business_id', id);
    // force reload des RSC qui dépendent du business
    window.location.reload();
  };

  const active = businesses.find((b) => b.id === activeId) ?? businesses[0] ?? null;

  return (
    <BusinessContext.Provider value={{ businesses, active, setActiveId: setActive, loading }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  return useContext(BusinessContext);
}
