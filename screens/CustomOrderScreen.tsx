import { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiErrorBanner } from "@/components/api-feedback";
import { DeliveryAddressField } from "@/components/delivery-address-field";
import { KeyboardAwareScroll } from "@/components/keyboard-aware-scroll";
import { OrderItemsList } from "@/components/order-items-list";
import { ScreenHeader } from "@/components/screen-header";
import { SurfaceCard } from "@/components/surface-card";
import { ThemedButton } from "@/components/themed-button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ValidatingTextInput } from "@/components/validating-text-input";
import { FIELD_LIMITS } from "@/constants/fieldLimits";
import { useNotification } from "@/context/NotificationContext";
import { useSessionBusy } from "@/hooks/use-session-busy";
import { useThemeColor } from "@/hooks/use-theme-color";
import { usePlaceOrderMutation } from "@/store/api/ordersApi";
import { useAppDispatch } from "@/store/hooks";
import { getApiErrorDetails } from "@/utils/apiError";
import {
  buildCustomOrderBody,
  CUSTOM_ORDER_MAX_ITEMS,
  CUSTOM_ORDER_MIN_ITEM_LENGTH,
  parseCustomOrderLines,
  validateCustomOrderForm,
} from "@/utils/customOrder";
import { orderPlacedMessage } from "@/utils/notificationMessages";
import { completeOrderPlacement } from "@/utils/orderPlacement";

const ITEMS_INPUT_MIN_HEIGHT = 150;
const ITEMS_INPUT_MAX_HEIGHT = 350;
const ITEMS_INPUT_LINE_HEIGHT = 20;

function getItemsInputHeight(lineCount: number): number {
  const lines = Math.max(lineCount, 8);
  return Math.min(
    ITEMS_INPUT_MAX_HEIGHT,
    Math.max(ITEMS_INPUT_MIN_HEIGHT, lines * ITEMS_INPUT_LINE_HEIGHT + 48),
  );
}

export default function CustomOrderScreen() {
  const dispatch = useAppDispatch();
  const { notify } = useNotification();
  const sessionBusy = useSessionBusy();
  const [placeOrder] = usePlaceOrderMutation();

  const [itemsText, setItemsText] = useState("");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingLabel, setLoadingLabel] = useState("Place order");
  const [error, setError] = useState("");
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ address?: string }>({});

  const primary = useThemeColor({}, "primary");
  const primaryText = useThemeColor({}, "primaryText");
  const borderColor = useThemeColor({}, "border");
  const muted = useThemeColor({}, "muted");
  const danger = useThemeColor({}, "danger");

  const parsedItems = useMemo(
    () => parseCustomOrderLines(itemsText),
    [itemsText],
  );
  const itemsOverLimit = parsedItems.length > CUSTOM_ORDER_MAX_ITEMS;
  const itemsInputHeight = useMemo(
    () => getItemsInputHeight(itemsText.split("\n").length),
    [itemsText],
  );
  const surfaceAlt = useThemeColor({}, "surfaceAlt");

  const handlePlaceOrder = async () => {
    const validationErrors = validateCustomOrderForm(itemsText, address);
    setItemsError(validationErrors.items ?? null);
    setFieldErrors(
      validationErrors.address ? { address: validationErrors.address } : {},
    );
    if (validationErrors.items || validationErrors.address) return;

    setError("");
    setLoading(true);
    setLoadingLabel("Placing order...");
    try {
      const body = buildCustomOrderBody(itemsText, address);
      const order = await placeOrder({ kind: "custom", body }).unwrap();

      await completeOrderPlacement(dispatch, order, {
        notify,
        notification: orderPlacedMessage(order.orderNo),
        onProgress: setLoadingLabel,
      });
    } catch (err) {
      const details = getApiErrorDetails(
        err,
        "Could not place your custom order. Please try again.",
      );
      setError(details.message);
    } finally {
      setLoading(false);
      setLoadingLabel("Place order");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAwareScroll contentContainerStyle={styles.container}>
        <ScreenHeader title="Non-listed items" />
        <ThemedText style={{ color: muted }}>
          Type what you need — each new line is one item. Payment is cash on
          delivery only; the store will confirm the price when your order is
          processed.
        </ThemedText>

        <SurfaceCard
          subtitle={`One item per line · ${CUSTOM_ORDER_MIN_ITEM_LENGTH}–${FIELD_LIMITS.customOrderLine} characters each · up to ${CUSTOM_ORDER_MAX_ITEMS} items`}
        >
          <View style={styles.listHeader}>
            <ThemedText type="defaultSemiBold">Your list</ThemedText>
            {parsedItems.length > 0 ? (
              <View
                style={[
                  styles.countBadge,
                  {
                    backgroundColor: itemsOverLimit
                      ? `${danger}18`
                      : `${primary}18`,
                    borderColor: itemsOverLimit ? danger : primary,
                  },
                ]}
              >
                <ThemedText
                  style={[
                    styles.countBadgeText,
                    { color: itemsOverLimit ? danger : primary },
                  ]}
                >
                  {parsedItems.length}/{CUSTOM_ORDER_MAX_ITEMS}
                </ThemedText>
              </View>
            ) : null}
          </View>

          <View
            style={[
              styles.itemsInputWrap,
              { borderColor, backgroundColor: surfaceAlt },
            ]}
          >
            <ValidatingTextInput
              placeholder={
                "Organic honey 500g\nFresh coriander bunch\nBasmati rice 5kg\nDetergent powder\nMilk 1L"
              }
              value={itemsText}
              onChangeText={(text) => {
                setItemsText(text);
                if (itemsError) setItemsError(null);
              }}
              maxLength={FIELD_LIMITS.customOrderNotes}
              multiline
              minHeight={itemsInputHeight}
              maxHeight={ITEMS_INPUT_MAX_HEIGHT}
              inputStyle={styles.itemsInput}
              error={itemsError ?? undefined}
            />
          </View>

          {parsedItems.length > 0 ? (
            <SurfaceCard nested style={{ backgroundColor: surfaceAlt }}>
              <ThemedText
                type="defaultSemiBold"
                style={[
                  styles.previewTitle,
                  itemsOverLimit ? { color: danger } : undefined,
                ]}
              >
                Preview ({parsedItems.length}/{CUSTOM_ORDER_MAX_ITEMS})
              </ThemedText>
              {itemsOverLimit ? (
                <ThemedText style={{ color: danger, fontSize: 13 }}>
                  Remove {parsedItems.length - CUSTOM_ORDER_MAX_ITEMS} item
                  {parsedItems.length - CUSTOM_ORDER_MAX_ITEMS === 1
                    ? ""
                    : "s"}{" "}
                  to continue.
                </ThemedText>
              ) : null}
              <OrderItemsList
                labels={parsedItems.slice(0, CUSTOM_ORDER_MAX_ITEMS)}
              />
            </SurfaceCard>
          ) : null}
        </SurfaceCard>

        <SurfaceCard title="Payment">
          <ThemedView
            style={[
              styles.codChip,
              { borderColor: primary, backgroundColor: primary },
            ]}
          >
            <ThemedText style={{ color: primaryText, fontWeight: "700" }}>
              Cash on Delivery
            </ThemedText>
          </ThemedView>
          <ThemedText style={{ color: muted, fontSize: 13 }}>
            No online payment or bank transfer for custom requests. Pay when
            your order is delivered.
          </ThemedText>
        </SurfaceCard>

        <SurfaceCard>
          <DeliveryAddressField
            value={address}
            onChange={setAddress}
            error={fieldErrors.address}
            onClearError={() => setFieldErrors({})}
            onLocationError={setError}
            onLocationSuccess={() => setError("")}
            hint="Include house number, street, and city so delivery can reach you."
          />
        </SurfaceCard>

        <ApiErrorBanner title="Custom order" message={error || null} />

        <ThemedButton
          variant="primary"
          size="large"
          label="Place custom order"
          loading={loading}
          loadingLabel={loadingLabel}
          disabled={sessionBusy || itemsOverLimit}
          onPress={handlePlaceOrder}
        />
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
    gap: 12,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  previewTitle: {
    marginBottom: 2,
  },
  listHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  countBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  itemsInputWrap: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    marginTop: -4,
  },
  itemsInput: {
    borderWidth: 0,
    backgroundColor: "transparent",
    fontSize: 16,
    lineHeight: ITEMS_INPUT_LINE_HEIGHT,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  codChip: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
});
