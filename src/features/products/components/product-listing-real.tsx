'use client';

import { useEffect, useState } from 'react';
import { catalogApi, type Item } from '@/lib/dodome-api';
import { searchParamsCache } from '@/lib/searchparams';
import { DataTable as ProductTable } from '@/components/ui/table/data-table';
import { columns as productColumns } from './product-tables/columns';
import type { Product } from '@/constants/data';

// Adaptateur Item DODOME -> Product du starter (pour réutiliser la table existante)
function toProduct(item: Item): Product {
  return {
    id: Number(item.id.slice(0, 8).replace(/-/g, '')) || 0, // uuid -> number pour compat
    name: item.nom,
    description: item.description,
    price: parseFloat(item.prix),
    photo_url:
      item.photos[0]?.image ??
      `https://api.slingacademy.com/public/sample-products/1.png`,
    category: item.category?.nom ?? 'Sans catégorie',
    created_at: item.created_at,
    updated_at: item.created_at
  } as Product;
}

export default function ProductListingReal() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('q');
  const pageLimit = searchParamsCache.get('limit');
  const categories = searchParamsCache.get('categories');

  const businessId =
    process.env.NEXT_PUBLIC_DEFAULT_BUSINESS_ID ??
    (typeof window !== 'undefined'
      ? localStorage.getItem('dodome_business_id')
      : null);

  const [data, setData] = useState<{ products: Product[]; total: number }>({
    products: [],
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) {
      setError(
        'Aucun business sélectionné. Définissez NEXT_PUBLIC_DEFAULT_BUSINESS_ID ou stockez dodome_business_id dans localStorage.'
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
        Erreur API: {error} — fallback mock désactivé. Vérifiez
        NEXT_PUBLIC_API_URL et le token.
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
