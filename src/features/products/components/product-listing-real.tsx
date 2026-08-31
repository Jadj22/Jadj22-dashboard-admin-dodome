'use client';

import { useEffect, useState } from 'react';
import { catalogApi, type Item } from '@/lib/dodome-api';
import { useSearchParams } from 'next/navigation';
import { DataTable as ProductTable } from '@/components/ui/table/data-table';
import { columns as productColumns } from './product-tables/columns';
import type { Product } from '@/constants/data';
import { useBusiness } from '@/hooks/use-business';

export default function ProductListingReal() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1);
  const search = searchParams.get('q');
  const pageLimit = Number(searchParams.get('limit') ?? 10);
  const categories = searchParams.get('categories');

  const {
    businesses,
    activeId,
    setActiveId,
    loading: businessLoading,
    membership,
    currentBusiness
  } = useBusiness();

  const businessId = process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_ID ?? activeId;

  const [data, setData] = useState<{ products: Product[]; total: number }>({
    products: [],
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) {
      setError(
        'Aucun business sélectionné. Veuillez en choisir un dans la liste ci-dessous.'
      );
      setLoading(false);
      return;
    }
    setLoading(true);
    catalogApi
      .items(businessId, {
        page,
        limit: pageLimit,
        search: search ?? undefined,
        // categories du starter = "Electronics.Furniture" -> on prend la 1ère
        category_id: undefined
      })
      .then((res) => {
        const products = res.results.map(toProduct);
        setData({ products, total: res.count });
        setError(null);
      })
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }, [businessId, page, pageLimit, search, categories]);

  if (loading)
    return (
      <div className='text-muted-foreground p-8 text-sm'>
        Chargement catalogue DODOME...
      </div>
    );
  if (error)
    return (
      <div className='text-destructive p-8 text-sm'>
        <p>{error}</p>
        {businesses && businesses.length > 0 && (
          <div className='mt-4'>
            <p className='text-muted-foreground text-sm'>
              Aucun business actif ? Sélectionnez-en un :{' '}
              <select
                onChange={(e) => setActiveId(e.target.value)}
                className='input-primary mt-2 block w-full rounded border'
              >
                <option value=''>-- Sélectionner un business --</option>
                {businesses.map((b) => (
                  <option key={b.id} value={b.id} selected={b.id === activeId}>
                    {b.nom}
                  </option>
                ))}
              </select>
            </p>
          </div>
        )}
      </div>
    );

  return (
    <ProductTable
      columns={productColumns}
      data={data.products}
      totalItems={data.total}
    />
  );
}
