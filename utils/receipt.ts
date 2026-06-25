import {
  CUSTOM_ORDER_TOTAL_LABEL,
  formatOrderStatus,
  formatPaymentMethod,
} from '@/utils/orderDisplay';
import type { OrderType, PaymentMethod, WalletProvider } from '@/types/domain';

export type ReceiptItem = {
  productId?: number;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  isCustom?: boolean;
};

export type Receipt = {
  receiptNumber: string;
  orderNo: string;
  orderType?: OrderType;
  status: string;
  createdAt: string;
  deliveryAddress: string;
  items: ReceiptItem[];
  totalAmount: number;
  paymentMethod?: PaymentMethod;
  walletProvider?: WalletProvider | null;
  customer: {
    id: number;
    email: string;
  };
};

function normalizeReceiptItem(raw: unknown): ReceiptItem {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const productIdRaw = record.productId ?? record.product_id;
  const hasProductId =
    productIdRaw != null && String(productIdRaw).trim() !== '' && String(productIdRaw) !== '0';
  const isCustomRaw = record.isCustom ?? record.is_custom ?? record.custom;
  const isCustom =
    isCustomRaw === true ||
    isCustomRaw === 'true' ||
    isCustomRaw === 1 ||
    (!hasProductId && Boolean(record.name ?? record.description));

  return {
    productId: hasProductId ? Number(productIdRaw) : undefined,
    name: String(record.name ?? record.productName ?? record.description ?? ''),
    unitPrice: Number(record.unitPrice ?? record.unit_price ?? record.price ?? 0),
    quantity: Math.max(1, Number(record.quantity ?? 1)),
    lineTotal: Number(record.lineTotal ?? record.line_total ?? 0),
    isCustom: isCustom ? true : undefined,
  };
}

export function normalizeReceipt(raw: unknown): Receipt {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const orderNoRaw =
    record.orderNo ?? record.order_no ?? record.orderNumber ?? record.order_number;
  const orderTypeRaw = record.orderType ?? record.order_type;
  const itemsRaw = record.items;
  let items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeReceiptItem) : [];
  const customItemsRaw = record.customItems ?? record.custom_items;
  if (items.length === 0 && Array.isArray(customItemsRaw) && customItemsRaw.length > 0) {
    items = customItemsRaw.map((line) => ({
      name: String(line),
      unitPrice: 0,
      quantity: 1,
      lineTotal: 0,
      isCustom: true as const,
    }));
  }

  const inferredCustom =
    orderTypeRaw === 'custom' ||
    orderTypeRaw === 'CUSTOM' ||
    items.some((item) => item.isCustom) ||
    (Array.isArray(customItemsRaw) && customItemsRaw.length > 0);

  const paymentMethod = (record.paymentMethod ?? record.payment_method) as PaymentMethod | undefined;
  const walletProvider = (record.walletProvider ?? record.wallet_provider) as
    | WalletProvider
    | null
    | undefined;

  return {
    receiptNumber: String(record.receiptNumber ?? record.receipt_number ?? ''),
    orderNo: orderNoRaw != null ? String(orderNoRaw).trim() : '',
    orderType: inferredCustom ? 'custom' : 'catalog',
    status: String(record.status ?? ''),
    createdAt: String(record.createdAt ?? record.created_at ?? ''),
    deliveryAddress: String(record.deliveryAddress ?? record.delivery_address ?? ''),
    items,
    totalAmount: Number(record.totalAmount ?? record.total_amount ?? 0),
    paymentMethod,
    walletProvider: walletProvider ?? null,
    customer: (record.customer && typeof record.customer === 'object'
      ? record.customer
      : { id: 0, email: '' }) as Receipt['customer'],
  };
}

export function isCustomReceipt(receipt: Pick<Receipt, 'orderType' | 'items'>): boolean {
  if (receipt.orderType === 'custom') return true;
  return receipt.items.some((item) => item.isCustom);
}

export function formatReceiptTotalLabel(receipt: Pick<Receipt, 'orderType' | 'totalAmount' | 'items'>): string {
  if (isCustomReceipt(receipt)) {
    return CUSTOM_ORDER_TOTAL_LABEL;
  }
  return `Rs ${receipt.totalAmount.toLocaleString()}`;
}

export function getReceiptItemLabels(receipt: Receipt): string[] {
  return receipt.items
    .map((item) => {
      const qty = item.quantity > 1 ? ` ×${item.quantity}` : '';
      const label = item.name.trim() || 'Item';
      if (isCustomReceipt(receipt)) {
        return `${label}${qty}`;
      }
      const price = item.unitPrice > 0 ? ` — Rs ${item.unitPrice.toLocaleString()}` : '';
      return `${label}${qty}${price}`;
    })
    .filter(Boolean);
}

export function formatReceiptStatus(status: string): string {
  return formatOrderStatus(status);
}

export function formatReceiptPaymentMethod(receipt: Receipt): string {
  return formatPaymentMethod(receipt.paymentMethod, receipt.walletProvider);
}
