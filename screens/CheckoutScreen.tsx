import { OrderTotalsBreakdown } from "@/components/order-totals-breakdown";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiErrorBanner } from "@/components/api-feedback";
import { KeyboardAwareScroll } from "@/components/keyboard-aware-scroll";
import { BankTransferDetailsCard } from "@/components/bank-transfer-details-card";
import { ImagePickerField } from "@/components/image-picker-field";
import { useNotification } from "@/context/NotificationContext";
import { ValidatingTextInput } from "@/components/validating-text-input";
import { ScreenHeader } from "@/components/screen-header";
import { FIELD_LIMITS, validateRequired } from "@/constants/fieldLimits";
import { getApiErrorDetails, logApiError } from "@/utils/apiError";
import { getImagePart, pickImageFromLibrary } from "@/utils/imageUpload";
import { orderPlacedMessage } from "@/utils/notificationMessages";
import { buildOrderItemsFromCart } from "@/utils/orderItems";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCart } from "@/context/CartContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { usePlaceOrderMutation, type PlaceOrderRequest } from "@/store/api/ordersApi";
import { useAppDispatch } from "@/store/hooks";
import { queueReceiptForOrder } from "@/utils/receiptSession";
import { useSessionBusy } from "@/hooks/use-session-busy";
import { useGetStoreSettingsQuery } from "@/store/api/storeSettingsApi";
import type { PaymentMethod, WalletProvider } from "@/types/domain";
import { getCheckoutTotals } from "@/utils/delivery";
import { hasBankTransferDetails, hasWalletDetails } from "@/utils/storeSettings";

export default function CheckoutScreen() {
  const dispatch = useAppDispatch();
  const { notify } = useNotification();
  const sessionBusy = useSessionBusy();
  const { cart, total, clearCart } = useCart();
  const [placeOrder] = usePlaceOrderMutation();
  const {
    data: storeSettings,
    isError: storeSettingsError,
    error: storeSettingsQueryError,
    refetch: refetchStoreSettings,
  } = useGetStoreSettingsQuery();

  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [walletProvider, setWalletProvider] = useState<WalletProvider>("easypaisa");
  const [paymentReference, setPaymentReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Place Order");
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [transactionScreenshotUri, setTransactionScreenshotUri] = useState<string | null>(null);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    address?: string;
    paymentReference?: string;
    paymentProof?: string;
  }>({});

  const borderColor = useThemeColor({}, "border");
  const surface = useThemeColor({}, "surface");
  const primary = useThemeColor({}, "primary");
  const primaryText = useThemeColor({}, "primaryText");
  const muted = useThemeColor({}, "muted");
  const danger = useThemeColor({}, "danger");

  const checkoutTotals = useMemo(
    () => getCheckoutTotals(total, storeSettings),
    [total, storeSettings],
  );

  const bankTransferReady = hasBankTransferDetails(storeSettings);
  const storeSettingsErrorDetails = storeSettingsError
    ? getApiErrorDetails(
        storeSettingsQueryError,
        "Could not load store settings. Sign in and try again.",
      )
    : null;
  const walletReady = hasWalletDetails(storeSettings);
  const paymentAvailability = useMemo(
    () => ({
      credit_debit_card: false,
      cash_on_delivery: true,
      bank_transfer: bankTransferReady,
      wallet: walletReady,
    }),
    [bankTransferReady, walletReady]
  );

  const handleUseCurrentLocation = async () => {
    setError("");
    setLocating(true);
    try {
      const geolocation = globalThis.navigator?.geolocation;
      if (!geolocation) {
        setError("Location service is unavailable on this build.");
        return;
      }
      const position = (await new Promise((resolve, reject) => {
        geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 10000,
        });
      })) as { coords: { latitude: number; longitude: number } };
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
      );
      if (!response.ok) throw new Error("Reverse geocode failed");
      const data = (await response.json()) as { display_name?: string };
      if (!data.display_name) {
        setError("Could not resolve address for current location.");
        return;
      }
      setAddress(data.display_name.slice(0, FIELD_LIMITS.address));
      if (fieldErrors.address) {
        setFieldErrors((prev) => ({ ...prev, address: undefined }));
      }
    } catch {
      setError("Could not fetch current location and address.");
    } finally {
      setLocating(false);
    }
  };

  const pickTransactionScreenshot = () =>
    pickImageFromLibrary({
      aspect: [4, 3],
      quality: 0.85,
      onUri: (uri) => {
        setScreenshotError(null);
        setTransactionScreenshotUri(uri);
        if (fieldErrors.paymentProof) {
          setFieldErrors((prev) => ({ ...prev, paymentProof: undefined }));
        }
      },
      onSizeError: setScreenshotError,
    });

  const handlePlaceOrder = async () => {
    const errors: { address?: string; paymentReference?: string; paymentProof?: string } = {};
    const addressError = validateRequired(address, "Delivery address");
    if (addressError) errors.address = addressError;

    if (paymentMethod === "wallet" && !paymentReference.trim()) {
      errors.paymentReference = "Payment reference is required for wallet payments.";
    }
    if (paymentMethod === "bank_transfer") {
      const hasRef = Boolean(paymentReference.trim());
      const hasScreenshot = Boolean(transactionScreenshotUri);
      if (!hasRef && !hasScreenshot) {
        errors.paymentProof =
          "Add a transaction reference or upload a payment screenshot.";
      }
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (cart.length === 0) {
      setError("Your cart is empty. Add products before checking out.");
      return;
    }

    const orderItems = buildOrderItemsFromCart(cart);
    if (orderItems.length === 0) {
      setError(
        "Could not submit cart items. Go back to the store, add products again, then retry checkout.",
      );
      return;
    }
    if (orderItems.length !== cart.length) {
      setError("Some cart items have invalid product IDs. Remove them and add again from the store.");
      return;
    }

    if (!paymentAvailability[paymentMethod]) {
      setError("Selected payment method is currently unavailable.");
      return;
    }

    setError("");
    setLoading(true);
    setLoadingLabel("Placing order...");
    try {
      let request: PlaceOrderRequest;
      const trimmedReference = paymentReference.trim();

      if (paymentMethod === "bank_transfer" && transactionScreenshotUri) {
        const formData = new FormData();
        formData.append("address", address.trim());
        formData.append("paymentMethod", paymentMethod);
        formData.append("items", JSON.stringify(orderItems));
        if (trimmedReference) {
          formData.append("paymentReference", trimmedReference);
        }
        formData.append("paymentScreenshot", getImagePart(transactionScreenshotUri) as any);
        request = { kind: "formData", formData };
      } else {
        request = {
          kind: "json",
          body: {
            address: address.trim(),
            paymentMethod,
            items: orderItems,
            walletProvider: paymentMethod === "wallet" ? walletProvider : undefined,
            paymentReference: trimmedReference || undefined,
          },
        };
      }

      const order = await placeOrder(request).unwrap();

      setLoadingLabel("Generating receipt...");
      const receiptWork = queueReceiptForOrder(dispatch, order.id);
      try {
        await receiptWork;
      } catch {
        // Receipt may still be created; user can open from My Orders.
      }

      clearCart();
      notify(orderPlacedMessage(order.orderNo));
      if (paymentMethod === "bank_transfer") {
        router.replace({
          pathname: "/bank-transfer",
          params: {
            orderId: String(order.id),
            orderNo: order.orderNo,
            total: String(order.total),
          },
        });
      } else {
        router.replace({ pathname: "/receipt", params: { orderId: String(order.id) } });
      }
    } catch (err) {
      logApiError("POST /api/orders", err);
      const details = getApiErrorDetails(err, "Could not place order. Please try again.");
      setError(details.message);
    } finally {
      setLoading(false);
      setLoadingLabel("Place Order");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAwareScroll contentContainerStyle={styles.container}>
        <ScreenHeader title="Checkout" />
        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ThemedText style={styles.label}>Order summary</ThemedText>
          <ThemedText style={{ color: muted, marginBottom: 4 }}>
            {cart.length} item{cart.length === 1 ? "" : "s"} in cart
          </ThemedText>
          <OrderTotalsBreakdown totals={checkoutTotals} />
        </ThemedView>

        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ThemedText style={styles.label}>Payment Method</ThemedText>
          <View style={styles.methodRow}>
            {[
              { id: "cash_on_delivery", label: "Cash on Delivery" },
              { id: "bank_transfer", label: "Bank Transfer" },
              { id: "wallet", label: "Easypaisa / JazzCash" },
              { id: "credit_debit_card", label: "Card (Soon)" },
            ].map((method) => {
              const id = method.id as PaymentMethod;
              const available = paymentAvailability[id];
              const selected = paymentMethod === id;
              return (
                <Pressable
                  key={method.id}
                  disabled={!available}
                  onPress={() => {
                    setPaymentMethod(id);
                    if (id !== "bank_transfer") {
                      setTransactionScreenshotUri(null);
                      setScreenshotError(null);
                    }
                  }}
                  style={[
                    styles.methodChip,
                    { borderColor },
                    selected && { borderColor: primary, backgroundColor: primary },
                    !available && styles.disabledChip,
                  ]}>
                  <ThemedText style={selected ? { color: primaryText } : !available ? { color: muted } : undefined}>
                    {method.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {paymentMethod === "wallet" ? (
            <View style={styles.walletRow}>
              <Pressable
                style={[
                  styles.methodChip,
                  { borderColor },
                  walletProvider === "easypaisa" && { borderColor: primary, backgroundColor: primary },
                ]}
                onPress={() => setWalletProvider("easypaisa")}>
                <ThemedText style={walletProvider === "easypaisa" ? { color: primaryText } : undefined}>
                  Easypaisa
                </ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.methodChip,
                  { borderColor },
                  walletProvider === "jazzcash" && { borderColor: primary, backgroundColor: primary },
                ]}
                onPress={() => setWalletProvider("jazzcash")}>
                <ThemedText style={walletProvider === "jazzcash" ? { color: primaryText } : undefined}>
                  JazzCash
                </ThemedText>
              </Pressable>
            </View>
          ) : null}

          {paymentMethod === "bank_transfer" && bankTransferReady && storeSettings ? (
            <>
              <BankTransferDetailsCard settings={storeSettings} amount={checkoutTotals.grandTotal} compact />
              <Pressable
                style={[styles.secondaryButton, { borderColor }]}
                onPress={() =>
                  router.push({
                    pathname: "/bank-transfer",
                    params: { total: String(checkoutTotals.grandTotal) },
                  })
                }>
                <ThemedText>Open full bank transfer screen</ThemedText>
              </Pressable>
            </>
          ) : null}

          {paymentMethod === "bank_transfer" ? (
            <>
              <ValidatingTextInput
                label="Payment reference"
                optional
                placeholder="Transaction ID or bank reference"
                value={paymentReference}
                onChangeText={(text) => {
                  setPaymentReference(text);
                  if (fieldErrors.paymentReference || fieldErrors.paymentProof) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      paymentReference: undefined,
                      paymentProof: undefined,
                    }));
                  }
                }}
                maxLength={FIELD_LIMITS.paymentReference}
                error={fieldErrors.paymentReference}
              />
              <ImagePickerField
                label="Transaction screenshot"
                optional
                variant="secondary"
                actionLabel="Upload screenshot"
                onPress={pickTransactionScreenshot}
                onRemove={() => {
                  setTransactionScreenshotUri(null);
                  setScreenshotError(null);
                  if (fieldErrors.paymentProof) {
                    setFieldErrors((prev) => ({ ...prev, paymentProof: undefined }));
                  }
                }}
                imageUri={transactionScreenshotUri}
                imageError={screenshotError ?? fieldErrors.paymentProof}
                disabled={loading}
                recyclingKey={
                  transactionScreenshotUri ? `txn-${transactionScreenshotUri}` : undefined
                }
                previewStyle={styles.screenshotPreview}
              />
              {fieldErrors.paymentProof && !screenshotError ? (
                <ThemedText style={{ color: danger, fontSize: 12 }}>{fieldErrors.paymentProof}</ThemedText>
              ) : null}
            </>
          ) : null}

          {paymentMethod === "wallet" ? (
            <ValidatingTextInput
              label="Payment Reference"
              placeholder="Transaction ID or reference"
              value={paymentReference}
              onChangeText={(text) => {
                setPaymentReference(text);
                if (fieldErrors.paymentReference) {
                  setFieldErrors((prev) => ({ ...prev, paymentReference: undefined }));
                }
              }}
              maxLength={FIELD_LIMITS.paymentReference}
              error={fieldErrors.paymentReference}
            />
          ) : null}
        </ThemedView>

        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ValidatingTextInput
            label="Delivery Address"
            placeholder="House 12, Street 4, City"
            value={address}
            onChangeText={(text) => {
              setAddress(text);
              if (fieldErrors.address) {
                setFieldErrors((prev) => ({ ...prev, address: undefined }));
              }
            }}
            maxLength={FIELD_LIMITS.address}
            multiline
            error={fieldErrors.address}
          />
          <Pressable
            style={[styles.secondaryButton, { borderColor }, locating && styles.buttonDisabled]}
            onPress={handleUseCurrentLocation}
            disabled={locating}>
            <ThemedText>{locating ? "Fetching location..." : "Use current location"}</ThemedText>
          </Pressable>
        </ThemedView>

        <ApiErrorBanner
          title="Payment options unavailable"
          message={storeSettingsErrorDetails?.message}
          onRetry={refetchStoreSettings}
        />
        <ApiErrorBanner title="Checkout" message={error || null} />

        <Pressable
          style={[
            styles.checkoutButton,
            { backgroundColor: primary },
            (loading || sessionBusy || cart.length === 0) && styles.buttonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={loading || sessionBusy || cart.length === 0}>
          {loading ? (
            <ActivityIndicator color={primaryText} />
          ) : null}
          <ThemedText style={[styles.checkoutText, { color: primaryText }]}>
            {loading ? loadingLabel : "Place Order"}
          </ThemedText>
        </Pressable>
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
  },
  methodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  walletRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  methodChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  disabledChip: {
    opacity: 0.45,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
  },
  checkoutButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
  },
  checkoutText: {
    fontSize: 18,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  screenshotPreview: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
});
