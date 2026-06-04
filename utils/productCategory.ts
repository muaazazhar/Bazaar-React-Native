import type { Category, Product } from '@/types/domain';

/** Resolves the category id for forms from product list/detail payloads. */
export function resolveProductCategoryId(
  product: Pick<Product, 'categoryId' | 'category'> | null | undefined,
  categories: Category[] = [],
): string | null {
  if (!product) {
    return null;
  }

  const directId = product.categoryId;
  if (directId != null && String(directId).trim() !== '') {
    const id = String(directId);
    const match = categories.find((c) => String(c.id) === id);
    return match ? String(match.id) : id;
  }

  const nestedId = product.category?.id;
  if (nestedId != null && String(nestedId).trim() !== '') {
    const id = String(nestedId);
    const match = categories.find((c) => String(c.id) === id);
    return match ? String(match.id) : id;
  }

  const nestedName = product.category?.name?.trim();
  if (nestedName && categories.length > 0) {
    const byName = categories.find(
      (c) => c.name.trim().toLowerCase() === nestedName.toLowerCase(),
    );
    if (byName) {
      return String(byName.id);
    }
  }

  return null;
}
