import { useEffect, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ApiErrorBanner } from "@/components/api-feedback";
import { useNotification } from "@/context/NotificationContext";
import { KeyboardAwareScroll } from "@/components/keyboard-aware-scroll";
import { ScreenHeader } from "@/components/screen-header";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { ValidatingTextInput } from "@/components/validating-text-input";
import {
  FIELD_LIMITS,
  validateDeliveryCharge,
  validateRequired,
} from "@/constants/fieldLimits";
import { useThemeColor } from "@/hooks/use-theme-color";
import {
  useGetStoreSettingsQuery,
  useUpsertStoreSettingsMutation,
} from "@/store/api/storeSettingsApi";
import type { StoreSettings, PopularProductCriteria } from "@/types/domain";
import { getApiErrorDetails } from "@/utils/apiError";
import { notifyApiFailure, notifySuccess } from "@/utils/inAppNotify";

const defaultSettings: StoreSettings = {
  bankName: "",
  accountTitle: "",
  accountNumber: "",
  iban: "",
  instructions: null,
  easypaisaNumber: null,
  jazzcashNumber: null,
  freeDeliveryEnabled: false,
  deliveryCharge: 0,
  popularProductLimit: 12,
  popularCriteria: "most_ordered",
  featuredProductIds: [],
};

const POPULAR_CRITERIA_OPTIONS: { value: PopularProductCriteria; label: string }[] = [
  { value: "most_ordered", label: "Most ordered" },
  { value: "highest_discount", label: "Highest discount" },
  { value: "newest", label: "Newest" },
  { value: "featured", label: "Featured list" },
];

type StoreSettingsFieldErrors = {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  deliveryCharge?: string;
};

export default function AdminStoreSettingsScreen() {
  const {
    data,
    isError: settingsLoadError,
    error: settingsQueryError,
  } = useGetStoreSettingsQuery();
  const [upsertSettings] = useUpsertStoreSettingsMutation();
  const [bankName, setBankName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [iban, setIban] = useState("");
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState("");
  const [popularProductLimit, setPopularProductLimit] = useState("12");
  const [popularCriteria, setPopularCriteria] =
    useState<PopularProductCriteria>("most_ordered");
  const [featuredProductIds, setFeaturedProductIds] = useState("");
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<StoreSettingsFieldErrors>({});
  const { notify } = useNotification();

  const borderColor = useThemeColor({}, "border");
  const surface = useThemeColor({}, "surface");
  const primary = useThemeColor({}, "primary");
  const primaryText = useThemeColor({}, "primaryText");
  const muted = useThemeColor({}, "muted");

  useEffect(() => {
    if (data) {
      setBankName(data.bankName ?? "");
      setAccountName(data.accountTitle ?? "");
      setAccountNumber(data.accountNumber ?? "");
      setIban(data.iban ?? "");
      setFreeDeliveryEnabled(data.freeDeliveryEnabled === true);
      const charge = data.deliveryCharge ?? 0;
      setDeliveryCharge(
        data.freeDeliveryEnabled || charge <= 0 ? "" : String(charge),
      );
      setPopularProductLimit(String(data.popularProductLimit ?? 12));
      setPopularCriteria(data.popularCriteria ?? "most_ordered");
      setFeaturedProductIds((data.featuredProductIds ?? []).join(", "));
    }
  }, [data]);

  const handleSave = async () => {
    const errors: StoreSettingsFieldErrors = {};
    const bankNameError = validateRequired(bankName, "Bank name");
    if (bankNameError) errors.bankName = bankNameError;
    const accountNameError = validateRequired(accountName, "Account name");
    if (accountNameError) errors.accountName = accountNameError;
    const accountNumberError = validateRequired(accountNumber, "Account no");
    if (accountNumberError) errors.accountNumber = accountNumberError;
    if (!freeDeliveryEnabled) {
      const deliveryError = validateDeliveryCharge(deliveryCharge);
      if (deliveryError) errors.deliveryCharge = deliveryError;
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const payload: StoreSettings = {
        ...defaultSettings,
        ...data,
        bankName: bankName.trim(),
        accountTitle: accountName.trim(),
        accountNumber: accountNumber.trim(),
        iban: iban.trim() || null,
        freeDeliveryEnabled,
        deliveryCharge: freeDeliveryEnabled ? 0 : Math.round(Number(deliveryCharge)),
        popularProductLimit: Math.max(
          1,
          Math.min(50, Math.round(Number(popularProductLimit)) || 12),
        ),
        popularCriteria,
        featuredProductIds: featuredProductIds
          .split(/[,\s]+/)
          .map((id) => id.trim())
          .filter(Boolean),
      };
      await upsertSettings({
        ...payload,
      }).unwrap();
      notifySuccess(notify, "Store settings updated.", {
        title: "Settings saved",
      });
    } catch (error) {
      notifyApiFailure(notify, error, "Could not save store settings.", {
        title: "Save failed",
        context: "PUT /api/payment-settings",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <KeyboardAwareScroll contentContainerStyle={styles.container}>
        <ScreenHeader title="Store Settings" />
        <ThemedText style={{ color: muted }}>
          Payments, delivery, and what customers see on the home screen..
        </ThemedText>
        <ApiErrorBanner
          title="Could not load settings"
          message={
            settingsLoadError
              ? getApiErrorDetails(
                  settingsQueryError,
                  "Could not load store settings.",
                ).message
              : null
          }
        />

        <ThemedView
          style={[styles.card, { borderColor, backgroundColor: surface }]}
        >
          <ThemedText type="defaultSemiBold">Delivery</ThemedText>
          <ThemedText style={{ color: muted, fontSize: 13 }}>
            Customers only see free delivery when it is enabled here. Otherwise
            the fixed charge is added at checkout.
          </ThemedText>
          <View style={styles.toggleRow}>
            <Pressable
              style={[
                styles.toggleChip,
                { borderColor },
                freeDeliveryEnabled && {
                  borderColor: primary,
                  backgroundColor: primary,
                },
              ]}
              onPress={() => {
                setFreeDeliveryEnabled(true);
                setDeliveryCharge("");
                setFieldErrors((p) => ({ ...p, deliveryCharge: undefined }));
              }}
            >
              <ThemedText
                style={freeDeliveryEnabled ? { color: primaryText } : undefined}
              >
                Free delivery
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.toggleChip,
                { borderColor },
                !freeDeliveryEnabled && {
                  borderColor: primary,
                  backgroundColor: primary,
                },
              ]}
              onPress={() => {
                setFreeDeliveryEnabled(false);
                setDeliveryCharge((prev) => {
                  const amount = Number(prev);
                  return prev.trim() === "" || !Number.isFinite(amount) || amount <= 0
                    ? ""
                    : prev;
                });
                setFieldErrors((p) => ({ ...p, deliveryCharge: undefined }));
              }}
            >
              <ThemedText
                style={
                  !freeDeliveryEnabled ? { color: primaryText } : undefined
                }
              >
                Fixed charge
              </ThemedText>
            </Pressable>
          </View>
          {!freeDeliveryEnabled ? (
            <ValidatingTextInput
              label="Delivery charge (Rs.)"
              placeholder="Required — e.g. 150"
              value={deliveryCharge}
              onChangeText={(text) => {
                setDeliveryCharge(text.replace(/[^\d.]/g, ""));
                if (fieldErrors.deliveryCharge) {
                  setFieldErrors((p) => ({ ...p, deliveryCharge: undefined }));
                }
              }}
              keyboardType="numeric"
              maxLength={FIELD_LIMITS.deliveryCharge}
              error={fieldErrors.deliveryCharge}
            />
          ) : null}
        </ThemedView>

        <ThemedView
          style={[styles.card, { borderColor, backgroundColor: surface }]}
        >
          <ThemedText type="defaultSemiBold">Popular products (home)</ThemedText>
          <ThemedText style={{ color: muted, fontSize: 13 }}>
            Controls what logged-in customers see on the home screen instead of the full catalog.
          </ThemedText>
          <ValidatingTextInput
            label="How many to show"
            placeholder="e.g. 12"
            value={popularProductLimit}
            onChangeText={(text) =>
              setPopularProductLimit(text.replace(/[^\d]/g, ""))
            }
            keyboardType="numeric"
            maxLength={2}
          />
          <ThemedText style={{ color: muted, fontSize: 13 }}>Ranking rule</ThemedText>
          <View style={styles.toggleRow}>
            {POPULAR_CRITERIA_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                style={[
                  styles.toggleChip,
                  { borderColor },
                  popularCriteria === option.value && {
                    borderColor: primary,
                    backgroundColor: primary,
                  },
                ]}
                onPress={() => setPopularCriteria(option.value)}
              >
                <ThemedText
                  style={
                    popularCriteria === option.value
                      ? { color: primaryText }
                      : undefined
                  }
                >
                  {option.label}
                </ThemedText>
              </Pressable>
            ))}
          </View>
          {popularCriteria === "featured" ? (
            <ValidatingTextInput
              label="Featured product IDs"
              placeholder="Comma-separated product ids, in display order"
              value={featuredProductIds}
              onChangeText={setFeaturedProductIds}
              multiline
              maxLength={500}
            />
          ) : null}
        </ThemedView>

        <ThemedView
          style={[styles.card, { borderColor, backgroundColor: surface }]}
        >
          <ThemedText type="defaultSemiBold">Bank account</ThemedText>
          <ValidatingTextInput
            label="Bank Name"
            placeholder="Bank Name"
            value={bankName}
            onChangeText={(text) => {
              setBankName(text);
              if (fieldErrors.bankName)
                setFieldErrors((p) => ({ ...p, bankName: undefined }));
            }}
            maxLength={FIELD_LIMITS.bankName}
            error={fieldErrors.bankName}
          />
          <ValidatingTextInput
            label="Account Name"
            placeholder="Account Name"
            value={accountName}
            onChangeText={(text) => {
              setAccountName(text);
              if (fieldErrors.accountName)
                setFieldErrors((p) => ({ ...p, accountName: undefined }));
            }}
            maxLength={FIELD_LIMITS.accountTitle}
            error={fieldErrors.accountName}
          />
          <ValidatingTextInput
            label="Account No"
            placeholder="1234-5678-9012"
            value={accountNumber}
            onChangeText={(text) => {
              setAccountNumber(text);
              if (fieldErrors.accountNumber)
                setFieldErrors((p) => ({ ...p, accountNumber: undefined }));
            }}
            maxLength={FIELD_LIMITS.accountNumber}
            error={fieldErrors.accountNumber}
          />
          <ValidatingTextInput
            label="IBAN"
            optional
            placeholder="PKXX...XXXXXXXXXX"
            value={iban}
            onChangeText={(text) => setIban(text.toUpperCase())}
            maxLength={FIELD_LIMITS.iban}
            autoCapitalize="characters"
          />
          <Pressable
            style={[
              styles.button,
              { backgroundColor: primary },
              saving && styles.buttonDisabled,
            ]}
            onPress={handleSave}
            disabled={saving}
          >
            <ThemedText style={[styles.buttonText, { color: primaryText }]}>
              {saving ? "Saving..." : "Save settings"}
            </ThemedText>
          </Pressable>
        </ThemedView>
      </KeyboardAwareScroll>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    padding: 16,
    paddingBottom: 40,
    gap: 12,
    width: "100%",
    maxWidth: 860,
    alignSelf: "center",
  },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  button: {
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  toggleChip: {
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
});
