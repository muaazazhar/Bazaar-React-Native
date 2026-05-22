import { router } from "expo-router";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ValidatingTextInput } from "@/components/validating-text-input";
import { ScreenHeader } from "@/components/screen-header";
import { FIELD_LIMITS, validateRequired } from "@/constants/fieldLimits";
import { getApiErrorMessage } from "@/utils/apiError";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCart } from "@/context/CartContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { usePlaceOrderMutation } from "@/store/api/ordersApi";
import { useGetPublicPaymentSettingsQuery } from "@/store/api/paymentSettingsApi";
import type { PaymentMethod, WalletProvider } from "@/types/domain";

export default function CheckoutScreen() {
  const { cart, total, clearCart } = useCart();
  const [placeOrder] = usePlaceOrderMutation();
  const { data: paymentSettings } = useGetPublicPaymentSettingsQuery();

  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [walletProvider, setWalletProvider] = useState<WalletProvider>("easypaisa");
  const [paymentReference, setPaymentReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    address?: string;
    paymentReference?: string;
  }>({});

  const borderColor = useThemeColor({}, "border");
  const surface = useThemeColor({}, "surface");
  const primary = useThemeColor({}, "primary");
  const primaryText = useThemeColor({}, "primaryText");
  const danger = useThemeColor({}, "danger");
  const muted = useThemeColor({}, "muted");

  const hasBankTransferDetails = Boolean(
    paymentSettings?.bankName &&
      paymentSettings?.accountTitle &&
      paymentSettings?.accountNumber &&
      paymentSettings?.iban
  );
  const hasWalletDetails = Boolean(
    paymentSettings?.easypaisaNumber || paymentSettings?.jazzcashNumber
  );
  const paymentAvailability = useMemo(
    () => ({
      credit_debit_card: false,
      cash_on_delivery: true,
      bank_transfer: hasBankTransferDetails,
      wallet: hasWalletDetails,
    }),
    [hasBankTransferDetails, hasWalletDetails]
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

  const handlePlaceOrder = async () => {
    const errors: { address?: string; paymentReference?: string } = {};
    const addressError = validateRequired(address, "Delivery address");
    if (addressError) errors.address = addressError;
    if (
      (paymentMethod === "bank_transfer" || paymentMethod === "wallet") &&
      !paymentReference.trim()
    ) {
      errors.paymentReference = "Payment reference is required for this method.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!paymentAvailability[paymentMethod]) {
      setError("Selected payment method is currently unavailable.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const orderItems = cart
        .map((item) => ({ productId: Number(item.product.id), quantity: item.quantity }))
        .filter((item) => !Number.isNaN(item.productId));

      const order = await placeOrder({
        address,
        paymentMethod,
        items: orderItems,
        walletProvider: paymentMethod === "wallet" ? walletProvider : undefined,
        paymentReference: paymentReference.trim() || undefined,
      }).unwrap();

      clearCart();
      router.replace({ pathname: "/receipt", params: { orderId: String(order.id) } });
    } catch (err) {
      setError(getApiErrorMessage(err, "Could not place order. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Checkout" />
        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ThemedText style={styles.label}>Total Amount</ThemedText>
          <ThemedText type="title">Rs. {total.toLocaleString()}</ThemedText>
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
                  onPress={() => setPaymentMethod(id)}
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

          {(paymentMethod === "bank_transfer" || paymentMethod === "wallet") ? (
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

        {!!error ? <ThemedText style={{ color: danger }}>{error}</ThemedText> : null}

        <Pressable
          style={[
            styles.checkoutButton,
            { backgroundColor: primary },
            (loading || cart.length === 0) && styles.buttonDisabled,
          ]}
          onPress={handlePlaceOrder}
          disabled={loading || cart.length === 0}>
          <ThemedText style={[styles.checkoutText, { color: primaryText }]}>
            {loading ? "Placing Order..." : "Place Order"}
          </ThemedText>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    padding: 16,
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
    marginTop: 8,
  },
  checkoutText: {
    fontSize: 18,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
