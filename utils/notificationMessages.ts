import { formatOrderStatus, getDisplayOrderNo } from '@/utils/orderDisplay';

function orderNoPhrase(orderNo: string | null | undefined): string {
  const no = orderNo?.trim();
  return no ? `order ${no}` : 'your order';
}

export function orderPlacedMessage(orderNo: string | null | undefined) {
  return {
    title: 'Order placed',
    message: `Your ${orderNoPhrase(orderNo)} was placed successfully. We'll keep you updated on its status.`,
    variant: 'success' as const,
  };
}

export function orderStatusUpdatedMessage(orderNo: string | null | undefined, status: string) {
  const no = getDisplayOrderNo({ orderNo: orderNo ?? undefined });
  return {
    title: 'Order status updated',
    message: no
      ? `Order ${no} is now ${formatOrderStatus(status)}.`
      : `Your order is now ${formatOrderStatus(status)}.`,
    variant: 'info' as const,
  };
}

export function adminOrderStatusUpdatedMessage(orderNo: string | null | undefined, status: string) {
  const no = getDisplayOrderNo({ orderNo: orderNo ?? undefined });
  return {
    title: 'Order updated',
    message: no
      ? `Order ${no} has been marked as ${formatOrderStatus(status)}.`
      : `An order has been marked as ${formatOrderStatus(status)}.`,
    variant: 'success' as const,
  };
}

export function orderStatusLockedMessage(orderNo: string | null | undefined, status: string) {
  const label = formatOrderStatus(status);
  const no = getDisplayOrderNo({ orderNo: orderNo ?? undefined });
  return {
    title: 'Status locked',
    message: no
      ? `Order ${no} is already ${label}. Fulfilled and cancelled orders cannot be updated.`
      : `This order is already ${label}. Fulfilled and cancelled orders cannot be updated.`,
    variant: 'warning' as const,
  };
}

export function orderStatusUpdateBusyMessage() {
  return {
    title: 'Please wait',
    message: 'Another order update is in progress. Try again in a moment.',
    variant: 'info' as const,
  };
}

export function productUpdatedMessage(name: string) {
  return {
    title: 'Product updated',
    message: `"${name}" was updated successfully.`,
    variant: 'success' as const,
  };
}

export function productCreatedMessage(name: string) {
  return {
    title: 'Product created',
    message: `"${name}" was added to the catalog.`,
    variant: 'success' as const,
  };
}

export function categoryUpdatedMessage(name: string) {
  return {
    title: 'Category updated',
    message: `"${name}" was updated successfully.`,
    variant: 'success' as const,
  };
}

export function categoryCreatedMessage(name: string) {
  return {
    title: 'Category created',
    message: `"${name}" was added to the catalog.`,
    variant: 'success' as const,
  };
}

export function productDeletedMessage(name: string) {
  return {
    title: 'Product deleted',
    message: `"${name}" was removed from the catalog.`,
    variant: 'success' as const,
  };
}

export function categoryDeletedMessage(name: string) {
  return {
    title: 'Category deleted',
    message: `"${name}" was removed from the catalog.`,
    variant: 'success' as const,
  };
}
