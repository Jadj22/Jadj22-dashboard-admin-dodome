'use client';

import { useBusiness } from '@/hooks/use-business';
import { catalogApi, type Item } from '@/lib/dodome-api';
import { useEffect, useState } from 'react';
import ProductForm from './product-form';

type TProductViewPageProps = {
  productId: string;
};

export default function ProductViewPage({ productId }: TProductViewPageProps) {
  const { active } = useBusiness();
  const [product, setProduct] = useState<Item | null>(null);
  const [loading, setLoading] = useState(productId !== 'new');

  const pageTitle =
    productId === 'new' ? 'Créer un nouvel article' : 'Modifier l’article';

  useEffect(() => {
    if (productId === 'new' || !active?.id) {
      setLoading(false);
      return;
    }

    catalogApi.items
      .get(active.id, productId)
      .then((data) => setProduct(data))
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [productId, active?.id]);

  if (loading) {
    return (
      <p className='text-muted-foreground p-6 text-sm'>
        Chargement des détails de l'article...
      </p>
    );
  }

  return <ProductForm initialData={product} pageTitle={pageTitle} />;
}
