import type { Category, Product } from '@/types/domain';
import { resolveEntityImageUrl } from '@/utils/catalogImages';

function asRecord(raw: unknown): Record<string, unknown> {
  return raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
}

export function normalizeCategory(raw: unknown): Category {
  const record = asRecord(raw);
  return {
    id: String(record.id ?? ''),
    name: String(record.name ?? ''),
    imageUrl: resolveEntityImageUrl(record),
  };
}

export function normalizeProduct(raw: unknown): Product {
  const record = asRecord(raw);
  const categoryPayload = record.category ?? record.Category ?? null;
  const nestedCategory =
    categoryPayload && typeof categoryPayload === 'object'
      ? normalizeCategory(categoryPayload)
      : null;
  const categoryIdRaw =
    record.categoryId ??
    record.category_id ??
    record.categoryID ??
    (typeof categoryPayload === 'number' || typeof categoryPayload === 'string'
      ? categoryPayload
      : null) ??
    nestedCategory?.id ??
    null;

  return {
    id: record.id as Product['id'],
    name: String(record.name ?? ''),
    price: (record.price ?? 0) as Product['price'],
    discountPercent:
      (record.discountPercent ?? record.discount_percent ?? record.discount ?? null) as Product['discountPercent'],
    categoryId:
      categoryIdRaw != null && String(categoryIdRaw).trim() !== '' ? String(categoryIdRaw) : null,
    category: nestedCategory,
    imageUrl: resolveEntityImageUrl(record),
  };
}
