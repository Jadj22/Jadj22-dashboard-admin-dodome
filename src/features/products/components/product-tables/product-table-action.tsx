'use client';

import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { useProductTableFilters } from './use-product-table-filters';
import { useBusiness } from '@/hooks/use-business';
import { catalogApi, type Category } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';

export default function ProductTableAction() {
  const { active } = useBusiness();
  const [categories, setCategories] = useState<
    { value: string; label: string }[]
  >([]);

  useEffect(() => {
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

  return (
    <div className='flex flex-wrap items-center gap-4'>
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
  );
}
