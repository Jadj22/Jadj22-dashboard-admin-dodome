import { notFound } from 'next/navigation';
import { fetchWithAuth } from '@/lib/utils';
import ProductForm from './product-form';

type TProductViewPageProps = {
  productId: string;
};

export default async function ProductViewPage({
  productId
}: TProductViewPageProps) {
  let product = null;
  let pageTitle = 'Create New Product';

  if (productId !== 'new') {
    const res = await fetchWithAuth(`/api/items/${productId}/`);
    if (!res.ok) {
      notFound();
    } else {
      const data = await res.json();
      product = data;
      pageTitle = `Edit Product`;
    }
  }

  return <ProductForm initialData={product} pageTitle={pageTitle} />;
}
