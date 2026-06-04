import type { Order, OrderItem, PaymentMethod, WalletProvider } from '@/types/domain';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  cash_on_delivery: 'Cash on Delivery',
  bank_transfer: 'Bank Transfer',
  wallet: 'Mobile Wallet',
  credit_debit_card: 'Credit / Debit Card',
};

const WALLET_LABELS: Record<WalletProvider, string> = {
  easypaisa: 'Easypaisa',
  jazzcash: 'JazzCash',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  processing: 'Processing',
  fulfilled: 'Fulfilled',
  cancelled: 'Cancelled',
};

function optionalOrderUrl(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function normalizeOrderItem(raw: unknown): OrderItem {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    productId: record.productId != null ? String(record.productId) : undefined,
    name: String(record.name ?? record.productName ?? ''),
    price: Number(record.price ?? record.unitPrice ?? 0),
    quantity: Number(record.quantity ?? 0),
  };
}

export function normalizeOrder(raw: unknown): Order {
  const record = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const totalRaw = record.total ?? record.totalAmount ?? record.total_amount;
  const total = Number(totalRaw ?? 0);
  const subtotalRaw = record.subtotal ?? record.subtotalAmount ?? record.subtotal_amount;
  const subtotal = subtotalRaw != null ? Number(subtotalRaw) : undefined;
  const deliveryRaw = record.deliveryCharge ?? record.delivery_charge;
  const deliveryCharge = deliveryRaw != null ? Number(deliveryRaw) : undefined;

  const userRaw = record.user;
  let user: Order['user'];
  if (userRaw && typeof userRaw === 'object') {
    const u = userRaw as Record<string, unknown>;
    user = {
      id: String(u.id ?? ''),
      email: String(u.email ?? ''),
      username: u.username != null ? String(u.username) : undefined,
    };
  } else if (typeof record.customerEmail === 'string' && record.customerEmail) {
    user = {
      id: String(record.userId ?? ''),
      email: record.customerEmail,
    };
  }

  const itemsRaw = record.items;
  const items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeOrderItem) : [];

  const paymentMethod = (record.paymentMethod ?? record.payment_method) as PaymentMethod | undefined;
  const walletProvider = (record.walletProvider ?? record.wallet_provider) as WalletProvider | null | undefined;

  const orderNoRaw = record.orderNo ?? record.order_no ?? record.orderNumber ?? record.order_number;
  const orderNo = orderNoRaw != null ? String(orderNoRaw).trim() : '';

  return {
    id: record.id != null ? (typeof record.id === 'number' || typeof record.id === 'string' ? record.id : String(record.id)) : '',
    orderNo,
    status: String(record.status ?? 'pending'),
    address: String(record.address ?? record.deliveryAddress ?? ''),
    total: Number.isFinite(total) ? total : 0,
    subtotal: subtotal != null && Number.isFinite(subtotal) ? subtotal : undefined,
    deliveryCharge:
      deliveryCharge != null && Number.isFinite(deliveryCharge) ? deliveryCharge : undefined,
    paymentScreenshotUrl: optionalOrderUrl(
      record.paymentScreenshotUrl ?? record.payment_screenshot_url ?? record.paymentScreenshot,
    ),
    createdAt: record.createdAt != null ? String(record.createdAt) : undefined,
    userId: record.userId != null ? String(record.userId) : undefined,
    user,
    items,
    paymentMethod,
    walletProvider: walletProvider ?? null,
    paymentReference:
      record.paymentReference != null
        ? String(record.paymentReference)
        : record.payment_reference != null
          ? String(record.payment_reference)
          : null,
    cancellationReason:
      record.cancellationReason != null
        ? String(record.cancellationReason)
        : record.cancellation_reason != null
          ? String(record.cancellation_reason)
          : record.cancelReason != null
            ? String(record.cancelReason)
            : null,
  };
}

export function formatPaymentMethod(
  method?: PaymentMethod | string | null,
  walletProvider?: WalletProvider | string | null,
): string {
  if (!method) return 'N/A';
  const base = PAYMENT_LABELS[method as PaymentMethod] ?? String(method).replace(/_/g, ' ');
  if (method === 'wallet' && walletProvider) {
    const wallet =
      WALLET_LABELS[walletProvider as WalletProvider] ??
      String(walletProvider).replace(/_/g, ' ');
    return `${base} (${wallet})`;
  }
  return base;
}

export function formatOrderStatus(status: string): string {
  return STATUS_LABELS[status.toLowerCase()] ?? status.replace(/_/g, ' ');
}

/** Public order number for UI, notifications, and bank references. Never use internal `id`. */
export function getDisplayOrderNo(order: { orderNo?: string | null }): string | null {
  const no = order.orderNo?.trim();
  return no ? no : null;
}

export function formatOrderHeading(order: { orderNo?: string | null }): string {
  const no = getDisplayOrderNo(order);
  return no ? `Order ${no}` : 'Order';
}

export function getOrderCustomerLabel(order: Order): string {
  return order.user?.email ?? order.user?.username ?? 'Customer';
}

export function normalizeOrderStatusKey(status: string): string {
  return status.trim().toLowerCase().replace(/\s+/g, '_');
}

/** Orders in these states cannot be updated further by admin. */
/** Bank-transfer orders that are not yet final still need payment instructions. */
export function orderNeedsBankTransferPayment(order: {
  paymentMethod?: string;
  status: string;
}): boolean {
  return order.paymentMethod === 'bank_transfer' && !isTerminalOrderStatus(order.status);
}

export function isTerminalOrderStatus(status: string): boolean {
  const normalized = normalizeOrderStatusKey(status);
  return (
    normalized === 'fulfilled' ||
    normalized === 'cancelled' ||
    normalized === 'canceled'
  );
}
