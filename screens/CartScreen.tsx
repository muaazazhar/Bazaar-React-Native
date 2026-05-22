import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { RemoteImage } from "@/components/remote-image";
import { ScreenHeader } from "@/components/screen-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useCart } from "@/context/CartContext";
import { useThemeColor } from "@/hooks/use-theme-color";

export default function CartScreen() {
  const { cart, total, clearCart, removeFromCart, increaseQuantity, decreaseQuantity } = useCart();

  const borderColor = useThemeColor({}, "border");
  const surface = useThemeColor({}, "surface");
  const primary = useThemeColor({}, "primary");
  const primaryText = useThemeColor({}, "primaryText");
  const danger = useThemeColor({}, "danger");
  const muted = useThemeColor({}, "muted");
  const surfaceAlt = useThemeColor({}, "surfaceAlt");

  const estimatedOriginalTotal = Math.round(total * 1.08);
  const savings = Math.max(0, estimatedOriginalTotal - total);

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={styles.root}>
        <ScrollView contentContainerStyle={styles.page} showsVerticalScrollIndicator={false}>
          <ScreenHeader title="Cart" />

          <View style={styles.headerRow}>
            <ThemedText type="title" style={styles.cartTitle}>Cart</ThemedText>
            <Pressable onPress={clearCart} disabled={cart.length === 0}>
              <ThemedText style={{ color: cart.length === 0 ? muted : danger }}>Clear cart</ThemedText>
            </Pressable>
          </View>

          {cart.length === 0 ? (
            <ThemedView style={[styles.emptyCard, { borderColor, backgroundColor: surface }]}>
              <ThemedText>Your cart is empty.</ThemedText>
            </ThemedView>
          ) : (
            cart.map((item, idx) => {
              const price = Number(item.product.price) || 0;
              const discount = Number(item.product.discountPercent ?? 0);
              const discounted = Number.isFinite(discount) && discount > 0
                ? price * (1 - Math.min(discount, 100) / 100)
                : price;
              const lineTotal = Math.round(discounted * item.quantity);
              const original = Math.round(price * item.quantity);
              return (
                <ThemedView
                  key={`${item.product.id}-${idx}`}
                  style={[styles.itemRow, { borderColor, backgroundColor: surface }]}>
                  <RemoteImage
                    uri={item.product.imageUrl}
                    style={styles.itemImage}
                    recyclingKey={`cart-${item.product.id}`}
                    fallbackSource={require("@/assets/images/icon.png")}
                  />
                  <View style={styles.itemInfo}>
                    <ThemedText numberOfLines={1} style={styles.itemName}>{item.product.name}</ThemedText>
                    <View style={styles.priceRow}>
                      <ThemedText type="defaultSemiBold">Rs. {lineTotal.toLocaleString()}</ThemedText>
                      {discount > 0 ? (
                        <ThemedText style={[styles.strikePrice, { color: muted }]}>Rs. {original.toLocaleString()}</ThemedText>
                      ) : null}
                    </View>
                  </View>
                  <View style={[styles.qtyBox, { borderColor }]}>
                    <Pressable onPress={() => decreaseQuantity(item.product.id)} style={styles.qtyButton}>
                      <ThemedText style={styles.qtySign}>-</ThemedText>
                    </Pressable>
                    <ThemedText style={styles.qtyValue}>{item.quantity}</ThemedText>
                    <Pressable onPress={() => increaseQuantity(item.product.id)} style={styles.qtyButton}>
                      <ThemedText style={styles.qtySign}>+</ThemedText>
                    </Pressable>
                  </View>
                  {item.quantity <= 1 ? (
                    <Pressable
                      style={[styles.deleteIconWrap, { borderColor }]}
                      onPress={() => removeFromCart(item.product.id)}>
                      <Ionicons name="trash-outline" size={16} color={danger} />
                    </Pressable>
                  ) : null}
                </ThemedView>
              );
            })
          )}

          {cart.length > 0 ? (
            <>
              <View style={[styles.savingsStrip, { backgroundColor: surfaceAlt }]}>
                <ThemedText style={[styles.savingsText, { color: primary }]}>
                  YOU&apos;RE SAVING RS. {savings.toLocaleString()}
                </ThemedText>
                <ThemedText style={{ color: primary }}>Add more items</ThemedText>
              </View>
              <View style={[styles.deliveryStrip, { backgroundColor: surfaceAlt }]}>
                <ThemedText>Congratulations! Enjoy free delivery on this order</ThemedText>
              </View>
            </>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { borderTopColor: borderColor, backgroundColor: surface }]}>
          <View style={styles.totalRow}>
            <ThemedText style={styles.totalLabel}>Total amount</ThemedText>
            <ThemedText type="defaultSemiBold" style={styles.totalValue}>Rs. {total.toLocaleString()}</ThemedText>
          </View>
          <Pressable
            style={[
              styles.checkoutButton,
              { backgroundColor: primary },
              cart.length === 0 && styles.buttonDisabled,
            ]}
            onPress={() => router.push("/checkout")}
            disabled={cart.length === 0}>
            <ThemedText style={[styles.checkoutText, { color: primaryText }]}>
              Checkout
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  root: { flex: 1 },
  page: {
    padding: 16,
    paddingBottom: 180,
    gap: 10,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cartTitle: {
    fontSize: 40,
    lineHeight: 40,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  itemRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemImage: {
    width: 42,
    height: 42,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 16,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  strikePrice: {
    textDecorationLine: "line-through",
    fontSize: 14,
  },
  qtyBox: {
    borderWidth: 1,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    height: 34,
  },
  qtyButton: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  qtySign: {
    fontSize: 20,
    lineHeight: 20,
  },
  qtyValue: {
    width: 22,
    textAlign: "center",
  },
  deleteIconWrap: {
    borderWidth: 1,
    borderRadius: 10,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  savingsStrip: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  savingsText: {
    fontWeight: "700",
  },
  deliveryStrip: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 18,
    gap: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 30,
    lineHeight: 32,
  },
  totalValue: {
    fontSize: 32,
    lineHeight: 34,
  },
  checkoutButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkoutText: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
