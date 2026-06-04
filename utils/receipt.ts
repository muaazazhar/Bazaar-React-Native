export type ReceiptItem = {
  productId: number;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
};

export type Receipt = {
  receiptNumber: string;
  orderNo: string;
  status: string;
  createdAt: string;
  deliveryAddress: string;
  items: ReceiptItem[];
  totalAmount: number;
  customer: {
    id: number;
    email: string;
  };
};

export function normalizeReceipt(raw: unknown): Receipt {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const orderNoRaw =
    record.orderNo ?? record.order_no ?? record.orderNumber ?? record.order_number;

  return {
    receiptNumber: String(record.receiptNumber ?? record.receipt_number ?? ''),
    orderNo: orderNoRaw != null ? String(orderNoRaw).trim() : '',
    status: String(record.status ?? ''),
    createdAt: String(record.createdAt ?? record.created_at ?? ''),
    deliveryAddress: String(record.deliveryAddress ?? record.delivery_address ?? ''),
    items: Array.isArray(record.items) ? (record.items as Receipt['items']) : [],
    totalAmount: Number(record.totalAmount ?? record.total_amount ?? 0),
    customer: (record.customer && typeof record.customer === 'object'
      ? record.customer
      : { id: 0, email: '' }) as Receipt['customer'],
  };
}
