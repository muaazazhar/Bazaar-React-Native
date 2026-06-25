import type { StoreSettings, PopularProductCriteria } from '@/types/domain';

const POPULAR_CRITERIA: PopularProductCriteria[] = [
  'most_ordered',
  'highest_discount',
  'newest',
  'featured',
];

function normalizePopularCriteria(value: unknown): PopularProductCriteria {
  const text = String(value ?? 'most_ordered').trim().toLowerCase();
  if (POPULAR_CRITERIA.includes(text as PopularProductCriteria)) {
    return text as PopularProductCriteria;
  }
  return 'most_ordered';
}

function normalizeFeaturedIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((id) => String(id).trim()).filter(Boolean);
}

function optionalString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

/** Normalizes store settings API payloads (camelCase or snake_case). */
export function normalizeStoreSettings(raw: unknown): StoreSettings | null {
  if (raw == null) {
    return null;
  }
  if (typeof raw !== 'object') {
    return null;
  }

  const record = raw as Record<string, unknown>;

  const deliveryRaw = record.deliveryCharge ?? record.delivery_charge;
  const deliveryCharge = Number(deliveryRaw ?? 0);
  const freeDeliveryRaw = record.freeDeliveryEnabled ?? record.free_delivery_enabled;

  return {
    bankName: String(record.bankName ?? record.bank_name ?? '').trim(),
    accountTitle: String(record.accountTitle ?? record.account_title ?? '').trim(),
    accountNumber: String(record.accountNumber ?? record.account_number ?? '').trim(),
    iban: optionalString(record.iban),
    instructions: optionalString(record.instructions),
    easypaisaNumber: optionalString(record.easypaisaNumber ?? record.easypaisa_number),
    jazzcashNumber: optionalString(record.jazzcashNumber ?? record.jazzcash_number),
    freeDeliveryEnabled: freeDeliveryRaw === true || freeDeliveryRaw === 'true' || freeDeliveryRaw === 1,
    deliveryCharge: Number.isFinite(deliveryCharge) && deliveryCharge >= 0 ? Math.round(deliveryCharge) : 0,
    popularProductLimit: Math.max(
      1,
      Math.min(
        50,
        Math.round(
          Number(record.popularProductLimit ?? record.popular_product_limit ?? 12),
        ) || 12,
      ),
    ),
    popularCriteria: normalizePopularCriteria(
      record.popularCriteria ?? record.popular_criteria,
    ),
    featuredProductIds: normalizeFeaturedIds(
      record.featuredProductIds ?? record.featured_product_ids,
    ),
    whatsappNumber: optionalString(record.whatsappNumber ?? record.whatsapp_number),
  };
}

export function hasBankTransferDetails(settings: StoreSettings | null | undefined): boolean {
  if (!settings) return false;
  return Boolean(settings.bankName && settings.accountTitle && settings.accountNumber);
}

export function hasWalletDetails(settings: StoreSettings | null | undefined): boolean {
  if (!settings) return false;
  return Boolean(settings.easypaisaNumber || settings.jazzcashNumber);
}
