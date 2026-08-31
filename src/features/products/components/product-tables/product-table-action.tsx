'use client';

import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { useProductTableFilters } from './use-product-table-filters';
import { useBusiness } from '@/hooks/use-business';
import { catalogApi, apiCache } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function ProductTableAction() {
  const router = useRouter();
  const { active } = useBusiness();
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);

  const loadCategories = () => {
    if (!active?.id) return;
    catalogApi
      .categories(active.id)
      .then((res) => {
        setCategories(
          (res || []).map((c) => ({
            value: c.id,
            label: c.nom
          }))
        );
      })
      .catch(() => setCategories([]));
  };

  useEffect(() => {
    loadCategories();
  }, [active?.id]);

  const {
    categoriesFilter,
    setCategoriesFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setPage,
    setSearchQuery
  } = useProductTableFilters();

  const handleRefresh = () => {
    setRefreshing(true);
    apiCache.invalidate('items');
    apiCache.invalidate('categories');
    loadCategories();
    router.refresh();
    toast.success('Catalogue actualisé');
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className='flex flex-wrap items-center justify-between gap-4'>
      <div className='flex flex-wrap items-center gap-3'>
        <DataTableSearch
          searchKey='name'
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          setPage={setPage}
        />
        {categories.length > 0 && (
          <DataTableFilterBox
            filterKey='categories'
            title='Catégories'
            options={categories}
            setFilterValue={setCategoriesFilter}
            filterValue={categoriesFilter}
          />
        )}
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>

      <Button
        variant='outline'
        size='sm'
        className='ml-auto gap-1.5'
        onClick={handleRefresh}
        disabled={refreshing}
      >
        <RefreshCw
          className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
        />
        Actualiser
      </Button>
    </div>
  );
}
