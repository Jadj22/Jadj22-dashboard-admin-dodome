'use client';

import { useEffect, useState } from 'react';
import { catalogApi, type Item } from '@/lib/dodome-api';
import { useSearchParams } from 'next/navigation';
import { DataTable as ProductTable } from '@/components/ui/table/data-table';
import { columns as productColumns } from './product-tables/columns';
import { useBusiness } from '@/hooks/use-business';

export default function ProductListingReal() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1);
  const search = searchParams.get('q') || undefined;
  const pageLimit = Number(searchParams.get('limit') ?? 10);
  const categories = searchParams.get('categories') || undefined;

  const { active, loading: businessLoading } = useBusiness();

  const [items, setItems] = useState<Item[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active?.id) {
      if (!businessLoading) {
        setError('Veuillez sélectionner un espace de travail actif.');
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    catalogApi
      .items(active.id, {
        page,
        limit: pageLimit,
        search,
        category_id: categories
      })
      .then((res) => {
        setItems(res.results || []);
        setTotal(res.count || 0);
        setError(null);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [active?.id, page, pageLimit, search, categories, businessLoading]);

  if (loading) {
    return (
      <div className='text-muted-foreground p-8 text-center text-sm'>
        Chargement des articles du catalogue...
      </div>
    );
  }

  if (error && !items.length) {
    return (
      <div className='text-muted-foreground rounded-lg border p-8 text-center text-sm'>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <ProductTable columns={productColumns} data={items} totalItems={total} />
  );
}
