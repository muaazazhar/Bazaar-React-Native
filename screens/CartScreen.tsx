import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ScreenHeader } from "@/components/screen-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCart } from "@/context/CartContext";
import { useThemeColor } from "@/hooks/use-theme-color";
import { usePlaceOrderMutation } from "@/store/api/ordersApi";
import { useGetPublicPaymentSettingsQuery } from "@/store/api/paymentSettingsApi";
import type { PaymentMethod, WalletProvider } from "@/types/domain";

export default function CartScreen() {
  const {
    cart,
    total,
    clearCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
  } = useCart();
  const [placeOrder] = usePlaceOrderMutation();
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");
  const [walletProvider, setWalletProvider] = useState<WalletProvider>("easypaisa");
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState("");
  const { data: paymentSettings } = useGetPublicPaymentSettingsQuery();
  const borderColor = useThemeColor({}, "border");
  const surface = useThemeColor({}, "surface");
  const inputBackground = useThemeColor({}, "inputBackground");
  const inputText = useThemeColor({}, "inputText");
  const primary = useThemeColor({}, "primary");
  const primaryText = useThemeColor({}, "primaryText");
  const danger = useThemeColor({}, "danger");
  const muted = useThemeColor({}, "muted");
  const hasBankTransferDetails = Boolean(
    paymentSettings?.bankName &&
      paymentSettings?.accountTitle &&
      paymentSettings?.accountNumber &&
      paymentSettings?.iban,
  );
  const hasWalletDetails = Boolean(
    paymentSettings?.easypaisaNumber || paymentSettings?.jazzcashNumber,
  );
  const paymentAvailability = useMemo(
    () => ({
      card: false,
      cod: true,
      bank_transfer: hasBankTransferDetails,
      wallet: hasWalletDetails,
    }),
    [hasBankTransferDetails, hasWalletDetails],
  );

  useEffect(() => {
    if (!paymentAvailability[paymentMethod]) {
      setPaymentMethod("cod");
    }
  }, [paymentAvailability, paymentMethod]);

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

      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      );
      if (!response.ok) {
        throw new Error("Reverse geocode failed");
      }
      const data = (await response.json()) as { display_name?: string };
      if (!data.display_name) {
        setError("Could not resolve address for current location.");
        return;
      }
      setAddress(data.display_name);
    } catch {
      setError("Could not fetch current location and address.");
    } finally {
      setLocating(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      setError("Please add a delivery address.");
      return;
    }
    if (!paymentAvailability[paymentMethod]) {
      setError("Selected payment method is currently unavailable.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const orderItems = Object.values(
        cart.reduce<Record<string, { productId: number; quantity: number }>>(
          (acc, item) => {
            const key = String(item.id);
            const productId = Number(item.id);
            if (Number.isNaN(productId)) {
              return acc;
            }
            if (!acc[key]) {
              acc[key] = { productId, quantity: 0 };
            }
            acc[key].quantity += 1;
            return acc;
          },
          {},
        ),
      );

      const order = await placeOrder({
        address,
        items: orderItems,
        paymentMethod,
        walletProvider: paymentMethod === "wallet" ? walletProvider : undefined,
        paymentReference: paymentReference.trim() || undefined,
      }).unwrap();
      clearCart();
      router.push({
        pathname: "/receipt",
        params: { orderId: String(order.id) },
      });
    } catch {
      setError("Could not place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView
        contentContainerStyle={styles.page}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.container}>
          <ScreenHeader title="Cart" />
          <ThemedText style={[styles.helperText, { color: muted }]}>
            Review items, add delivery address, then place your order.
          </ThemedText>

          {cart.length === 0 ? (
            <ThemedText>Your cart is empty.</ThemedText>
          ) : (
            cart.map((item, idx) => (
              <ThemedView
                key={`${item.product.id}-${idx}`}
                style={[
                  styles.itemRow,
                  { borderColor, backgroundColor: surface },
                ]}
              >
                <ThemedView style={styles.itemInfo}>
                  <ThemedText>{item.product.name}</ThemedText>
                  <ThemedText>Rs {item.product.price}</ThemedText>
                  <ThemedView
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    {item.quantity > 1 ? (
                      <>
                        <Pressable
                          style={[styles.removeButton, { borderColor }]}
                          onPress={() => decreaseQuantity(item.product.id)}
                        >
                          <ThemedText
                            style={[styles.removeButtonText, { color: danger }]}
                          >
                            -
                          </ThemedText>
                        </Pressable>
                        <ThemedText>{item.quantity}</ThemedText>
                        <Pressable
                          style={[styles.removeButton, { borderColor }]}
                          onPress={() => increaseQuantity(item.product.id)}
                        >
                          <ThemedText
                            style={[
                              styles.removeButtonText,
                              { color: primary },
                            ]}
                          >
                            +
                          </ThemedText>
                        </Pressable>
                      </>
                    ) : (
                      <>
                        <Pressable
                          style={[styles.removeButton, { borderColor: danger }]}
                          onPress={() => removeFromCart(item.product.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color={danger}
                          />
                        </Pressable>
                      </>
                    )}
                  </ThemedView>
                </ThemedView>
              </ThemedView>
            ))
          )}

          <ThemedText type="subtitle">Total: Rs {total}</ThemedText>
          <ThemedText style={styles.label}>Payment Method</ThemedText>
          <ThemedView style={styles.paymentMethodRow}>
            <Pressable
              style={[
                styles.methodChip,
                { borderColor },
                !paymentAvailability.card && styles.methodChipDisabled,
                paymentMethod === "card" && { backgroundColor: primary, borderColor: primary },
              ]}
              onPress={() => setPaymentMethod("card")}
              disabled={!paymentAvailability.card}
            >
              <ThemedText
                style={
                  !paymentAvailability.card
                    ? { color: muted }
                    : paymentMethod === "card"
                      ? { color: primaryText }
                      : undefined
                }>
                Credit / Debit Card (Soon)
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.methodChip,
                { borderColor },
                paymentMethod === "cod" && { backgroundColor: primary, borderColor: primary },
              ]}
              onPress={() => setPaymentMethod("cod")}
            >
              <ThemedText style={paymentMethod === "cod" ? { color: primaryText } : undefined}>Cash on Delivery</ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.methodChip,
                { borderColor },
                !paymentAvailability.bank_transfer && styles.methodChipDisabled,
                paymentMethod === "bank_transfer" && { backgroundColor: primary, borderColor: primary },
              ]}
              onPress={() => setPaymentMethod("bank_transfer")}
              disabled={!paymentAvailability.bank_transfer}
            >
              <ThemedText
                style={
                  !paymentAvailability.bank_transfer
                    ? { color: muted }
                    : paymentMethod === "bank_transfer"
                      ? { color: primaryText }
                      : undefined
                }>
                Bank Transfer
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.methodChip,
                { borderColor },
                !paymentAvailability.wallet && styles.methodChipDisabled,
                paymentMethod === "wallet" && { backgroundColor: primary, borderColor: primary },
              ]}
              onPress={() => setPaymentMethod("wallet")}
              disabled={!paymentAvailability.wallet}
            >
              <ThemedText
                style={
                  !paymentAvailability.wallet
                    ? { color: muted }
                    : paymentMethod === "wallet"
                      ? { color: primaryText }
                      : undefined
                }>
                Easypaisa / JazzCash
              </ThemedText>
            </Pressable>
          </ThemedView>
          {!paymentAvailability.bank_transfer || !paymentAvailability.wallet ? (
            <ThemedText style={[styles.helperText, { color: muted }]}>
              Bank transfer and wallet require configured admin payment details.
            </ThemedText>
          ) : null}

          {paymentMethod === "wallet" ? (
            <>
              <ThemedText style={styles.label}>Wallet Provider</ThemedText>
              <ThemedView style={styles.paymentMethodRow}>
                <Pressable
                  style={[
                    styles.methodChip,
                    { borderColor },
                    walletProvider === "easypaisa" && { backgroundColor: primary, borderColor: primary },
                  ]}
                  onPress={() => setWalletProvider("easypaisa")}
                >
                  <ThemedText style={walletProvider === "easypaisa" ? { color: primaryText } : undefined}>Easypaisa</ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.methodChip,
                    { borderColor },
                    walletProvider === "jazzcash" && { backgroundColor: primary, borderColor: primary },
                  ]}
                  onPress={() => setWalletProvider("jazzcash")}
                >
                  <ThemedText style={walletProvider === "jazzcash" ? { color: primaryText } : undefined}>JazzCash</ThemedText>
                </Pressable>
              </ThemedView>
            </>
          ) : null}

          {paymentMethod === "bank_transfer" && paymentSettings ? (
            <ThemedView style={[styles.infoCard, { borderColor, backgroundColor: surface }]}>
              <ThemedText type="defaultSemiBold">Bank Account Details</ThemedText>
              <ThemedText>Bank: {paymentSettings.bankName}</ThemedText>
              <ThemedText>Title: {paymentSettings.accountTitle}</ThemedText>
              <ThemedText>Account: {paymentSettings.accountNumber}</ThemedText>
              {paymentSettings.iban ? <ThemedText>IBAN: {paymentSettings.iban}</ThemedText> : null}
              {paymentSettings.instructions ? <ThemedText style={{ color: muted }}>{paymentSettings.instructions}</ThemedText> : null}
            </ThemedView>
          ) : null}

          {paymentMethod === "wallet" && paymentSettings ? (
            <ThemedView style={[styles.infoCard, { borderColor, backgroundColor: surface }]}>
              <ThemedText type="defaultSemiBold">Wallet Account Details</ThemedText>
              {paymentSettings.easypaisaNumber ? <ThemedText>Easypaisa: {paymentSettings.easypaisaNumber}</ThemedText> : null}
              {paymentSettings.jazzcashNumber ? <ThemedText>JazzCash: {paymentSettings.jazzcashNumber}</ThemedText> : null}
            </ThemedView>
          ) : null}

          {(paymentMethod === "bank_transfer" || paymentMethod === "wallet") ? (
            <>
              <ThemedText style={styles.label}>Payment Reference (optional)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    borderColor,
                    backgroundColor: inputBackground,
                    color: inputText,
                  },
                ]}
                placeholder="Transaction id / screenshot reference"
                placeholderTextColor={muted}
                value={paymentReference}
                onChangeText={setPaymentReference}
              />
            </>
          ) : null}

          {paymentMethod === "card" ? (
            <ThemedText style={[styles.helperText, { color: muted }]}>
              Card checkout API can be plugged into this flow once provider keys are configured.
            </ThemedText>
          ) : null}

          <ThemedText style={styles.label}>Delivery Address</ThemedText>
          <TextInput
            style={[
              styles.input,
              {
                borderColor,
                backgroundColor: inputBackground,
                color: inputText,
              },
            ]}
            placeholder="Enter full delivery address"
            placeholderTextColor={muted}
            multiline
            numberOfLines={3}
            value={address}
            onChangeText={setAddress}
          />
          <Pressable
            style={[
              styles.secondaryButton,
              { borderColor },
              (locating || loading) && styles.buttonDisabled,
            ]}
            onPress={handleUseCurrentLocation}
            disabled={locating || loading}
          >
            <ThemedText>
              {locating ? "Fetching location..." : "Use current location"}
            </ThemedText>
          </Pressable>
          {!!error && (
            <ThemedText style={[styles.error, { color: danger }]}>
              {error}
            </ThemedText>
          )}

          <Pressable
            style={[
              styles.button,
              { backgroundColor: primary },
              (loading || cart.length === 0) && styles.buttonDisabled,
            ]}
            onPress={handlePlaceOrder}
            disabled={loading || cart.length === 0}
          >
            <ThemedText style={[styles.buttonText, { color: primaryText }]}>
              {loading ? "Placing Order..." : "Place Order"}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  page: {
    flexGrow: 1,
    padding: 16,
  },
  container: {
    width: "100%",
    maxWidth: 720,
    alignSelf: "center",
    gap: 12,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  itemInfo: {
    gap: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  paymentMethodRow: {
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
  methodChipDisabled: {
    opacity: 0.45,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  helperText: {
    // color set from theme token
  },
  button: {
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "700",
  },
  error: {
    // color set from theme token
  },
  removeButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    alignItems: "center",
  },
  removeButtonText: {
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
