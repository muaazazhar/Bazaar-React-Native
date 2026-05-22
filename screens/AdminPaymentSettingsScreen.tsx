import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ValidatingTextInput } from '@/components/validating-text-input';
import { FIELD_LIMITS, validateRequired } from '@/constants/fieldLimits';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetAdminPaymentSettingsQuery, useUpsertPaymentSettingsMutation } from '@/store/api/paymentSettingsApi';
import { getApiErrorMessage } from '@/utils/apiError';
import type { PaymentSettings } from '@/types/domain';

const defaultSettings: PaymentSettings = {
  bankName: '',
  accountTitle: '',
  accountNumber: '',
  iban: '',
  instructions: null,
  easypaisaNumber: null,
  jazzcashNumber: null,
};

type PaymentFieldErrors = {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  iban?: string;
};

export default function AdminPaymentSettingsScreen() {
  const { data, isError: settingsLoadError, error: settingsQueryError } = useGetAdminPaymentSettingsQuery();
  const [upsertSettings] = useUpsertPaymentSettingsMutation();
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<PaymentFieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');
  const danger = useThemeColor({}, 'danger');

  useEffect(() => {
    if (data) {
      setBankName(data.bankName ?? '');
      setAccountName(data.accountTitle ?? '');
      setAccountNumber(data.accountNumber ?? '');
      setIban(data.iban ?? '');
    }
  }, [data]);

  const handleSave = async () => {
    const errors: PaymentFieldErrors = {};
    const bankNameError = validateRequired(bankName, 'Bank name');
    if (bankNameError) errors.bankName = bankNameError;
    const accountNameError = validateRequired(accountName, 'Account name');
    if (accountNameError) errors.accountName = accountNameError;
    const accountNumberError = validateRequired(accountNumber, 'Account no');
    if (accountNumberError) errors.accountNumber = accountNumberError;
    const ibanError = validateRequired(iban, 'IBAN');
    if (ibanError) errors.iban = ibanError;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      const payload: PaymentSettings = {
        ...defaultSettings,
        ...data,
        bankName: bankName.trim(),
        accountTitle: accountName.trim(),
        accountNumber: accountNumber.trim(),
        iban: iban.trim(),
      };
      await upsertSettings({
        ...payload,
      }).unwrap();
      alert('Bank account details updated.');
    } catch (error) {
      const message = getApiErrorMessage(error, 'Could not save bank account details.');
      setFormError(message);
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <ScreenHeader title="Payment Settings" />
        <ThemedText style={{ color: muted }}>
          Add or edit bank payment details.
        </ThemedText>
        {formError ? <ThemedText style={{ color: danger }}>{formError}</ThemedText> : null}
        {settingsLoadError ? (
          <ThemedText style={{ color: danger }}>
            {getApiErrorMessage(settingsQueryError, 'Could not load payment settings.')}
          </ThemedText>
        ) : null}

        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ValidatingTextInput
            label="Bank Name"
            placeholder="Meezan Bank"
            value={bankName}
            onChangeText={(text) => {
              setBankName(text);
              if (fieldErrors.bankName) setFieldErrors((p) => ({ ...p, bankName: undefined }));
            }}
            maxLength={FIELD_LIMITS.bankName}
            error={fieldErrors.bankName}
          />
          <ValidatingTextInput
            label="Account Name"
            placeholder="Bazaar Store"
            value={accountName}
            onChangeText={(text) => {
              setAccountName(text);
              if (fieldErrors.accountName) setFieldErrors((p) => ({ ...p, accountName: undefined }));
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
              if (fieldErrors.accountNumber) setFieldErrors((p) => ({ ...p, accountNumber: undefined }));
            }}
            maxLength={FIELD_LIMITS.accountNumber}
            error={fieldErrors.accountNumber}
          />
          <ValidatingTextInput
            label="IBAN"
            placeholder="PKxx...."
            value={iban}
            onChangeText={(text) => {
              setIban(text.toUpperCase());
              if (fieldErrors.iban) setFieldErrors((p) => ({ ...p, iban: undefined }));
            }}
            maxLength={FIELD_LIMITS.iban}
            autoCapitalize="characters"
            error={fieldErrors.iban}
          />
          <Pressable style={[styles.button, { backgroundColor: primary }, saving && styles.buttonDisabled]} onPress={handleSave} disabled={saving}>
            <ThemedText style={[styles.buttonText, { color: primaryText }]}>{saving ? 'Saving...' : 'Save Bank Account'}</ThemedText>
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
  container: {
    flexGrow: 1,
    padding: 16,
    gap: 12,
    width: '100%',
    maxWidth: 860,
    alignSelf: 'center',
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
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
