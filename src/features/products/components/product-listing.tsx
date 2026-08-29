import { DataTable as ProductTable } from '@/components/ui/table/data-table';
import { columns } from './product-tables/columns';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type ProductListingPage = {};

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  photo_url: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export default function ProductListingPage({}: ProductListingPage) {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1);
  const limit = Number(searchParams.get('limit') ?? 10);
  const search = searchParams.get('q');
  const categoryId = searchParams.get('category_id');
  const businessId =
    searchParams.get('businessId') ??
    localStorage.getItem('dodome_business_id') ??
    '';

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (!businessId) return;
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/businesses/${businessId}/items/`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Business-ID': businessId,
          Authorization: `Bearer ${localStorage.getItem('dodome_access') || ''}`
        }
      }
    )
      .then((res) => res.json())
      .then((data: any) => {
        setProducts(data.results || []);
        setTotal(data.count || 0);
      })
      .catch(() => {
        setProducts([]);
        setTotal(0);
      });
  }, [page, limit, search, categoryId, businessId]);

  return <ProductTable columns={columns} data={products} totalItems={total} />;
}
