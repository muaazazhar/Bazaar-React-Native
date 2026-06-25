import type { Order, OrderItem, OrderType, PaymentMethod, WalletProvider } from '@/types/domain';

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
  const productIdRaw = record.productId ?? record.product_id;
  const isCustomRaw = record.isCustom ?? record.is_custom ?? record.custom;
  const hasProductId =
    productIdRaw != null && String(productIdRaw).trim() !== '' && String(productIdRaw) !== '0';
  const isCustom =
    isCustomRaw === true ||
    isCustomRaw === 'true' ||
    isCustomRaw === 1 ||
    (!hasProductId &&
      Boolean(
        record.description ??
          record.customText ??
          record.custom_text ??
          (record.name && !record.productId),
      ));

  return {
    productId: hasProductId ? String(productIdRaw) : undefined,
    name: String(
      record.name ?? record.productName ?? record.description ?? record.customText ?? record.custom_text ?? '',
    ),
    price: Number(record.price ?? record.unitPrice ?? 0),
    quantity: Math.max(1, Number(record.quantity ?? 1)),
    isCustom: isCustom ? true : undefined,
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
    const phoneRaw = u.phone ?? u.phone_number;
    user = {
      id: String(u.id ?? ''),
      email: String(u.email ?? ''),
      username: u.username != null ? String(u.username) : undefined,
      phone:
        phoneRaw != null && String(phoneRaw).trim() !== ''
          ? String(phoneRaw).trim()
          : undefined,
    };
  } else if (typeof record.customerEmail === 'string' && record.customerEmail) {
    const phoneRaw = record.customerPhone ?? record.customer_phone;
    user = {
      id: String(record.userId ?? ''),
      email: record.customerEmail,
      phone:
        phoneRaw != null && String(phoneRaw).trim() !== ''
          ? String(phoneRaw).trim()
          : undefined,
    };
  }

  const itemsRaw = record.items;
  let items = Array.isArray(itemsRaw) ? itemsRaw.map(normalizeOrderItem) : [];
  const customItemsRaw = record.customItems ?? record.custom_items;
  if (items.length === 0 && Array.isArray(customItemsRaw) && customItemsRaw.length > 0) {
    items = customItemsRaw.map((line) => ({
      name: String(line),
      quantity: 1,
      price: 0,
      isCustom: true as const,
    }));
  }

  const paymentMethod = (record.paymentMethod ?? record.payment_method) as PaymentMethod | undefined;
  const walletProvider = (record.walletProvider ?? record.wallet_provider) as WalletProvider | null | undefined;

  const orderNoRaw = record.orderNo ?? record.order_no ?? record.orderNumber ?? record.order_number;
  const orderNo = orderNoRaw != null ? String(orderNoRaw).trim() : '';
  const orderTypeRaw = record.orderType ?? record.order_type;
  const inferredCustom =
    (Array.isArray(customItemsRaw) && customItemsRaw.length > 0) ||
    items.some((item) => item.isCustom);
  const orderType: Order['orderType'] =
    orderTypeRaw === 'custom' || orderTypeRaw === 'CUSTOM' || inferredCustom
      ? 'custom'
      : 'catalog';

  return {
    id: record.id != null ? (typeof record.id === 'number' || typeof record.id === 'string' ? record.id : String(record.id)) : '',
    orderNo,
    orderType,
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

export const CUSTOM_ORDER_BADGE = 'Custom request (non-catalog)';
export const CUSTOM_ORDER_TOTAL_LABEL = 'Price confirmed on delivery (COD)';

export function formatOrderHeading(order: { orderNo?: string | null }): string {
  const no = getDisplayOrderNo(order);
  return no ? `Order ${no}` : 'Order';
}

export function isCustomOrder(order: Pick<Order, 'orderType'> & { items?: OrderItem[] }): boolean {
  if (order.orderType === 'custom') return true;
  return (order.items ?? []).some((item) => item.isCustom);
}

export function formatOrderTotalLabel(order: Pick<Order, 'orderType' | 'total' | 'items'>): string {
  if (isCustomOrder(order)) {
    return CUSTOM_ORDER_TOTAL_LABEL;
  }
  return `Rs ${order.total.toLocaleString()}`;
}

export function getOrderItemLabels(order: Order): string[] {
  return (order.items ?? [])
    .map((item) => {
      const qty = item.quantity > 1 ? ` ×${item.quantity}` : '';
      const label = item.name.trim() || 'Item';
      return `${label}${qty}`;
    })
    .filter(Boolean);
}

export function getOrderListMeta(order: Order) {
  const custom = isCustomOrder(order);
  return {
    isCustom: custom,
    itemLabels: getOrderItemLabels(order),
    totalLabel: custom ? CUSTOM_ORDER_TOTAL_LABEL : `Rs ${order.total.toLocaleString()}`,
  };
}

export function buildReceiptRouteParams(order: Pick<Order, 'id' | 'paymentMethod' | 'orderType' | 'items'>) {
  const params: {
    orderId: string;
    paymentMethod?: PaymentMethod;
    orderType?: 'custom';
  } = { orderId: String(order.id) };
  if (order.paymentMethod) {
    params.paymentMethod = order.paymentMethod;
  }
  if (isCustomOrder(order)) {
    params.orderType = 'custom';
  }
  return params;
}

export function getOrderCustomerLabel(order: Order): string {
  const phone = order.user?.phone?.trim();
  if (phone) return phone;
  const email = order.user?.email?.trim();
  if (email) return email;
  const username = order.user?.username?.trim();
  if (username) return username;
  return 'Customer';
}

export function normalizeOrderStatusKey(status: string): string {
  return status.trim().toLowerCase().replace(/\s+/g, '_');
}

/** Bank-transfer orders that are not yet final still need payment instructions. */
export function orderNeedsBankTransferPayment(order: {
  paymentMethod?: string;
  status: string;
  orderType?: OrderType;
  items?: OrderItem[];
}): boolean {
  if (isCustomOrder(order)) return false;
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
