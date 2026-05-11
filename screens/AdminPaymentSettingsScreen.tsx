import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/components/screen-header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetAdminPaymentSettingsQuery, useUpsertPaymentSettingsMutation } from '@/store/api/paymentSettingsApi';
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

export default function AdminPaymentSettingsScreen() {
  const { data } = useGetAdminPaymentSettingsQuery();
  const [upsertSettings] = useUpsertPaymentSettingsMutation();
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [iban, setIban] = useState('');
  const [saving, setSaving] = useState(false);

  const borderColor = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const inputBackground = useThemeColor({}, 'inputBackground');
  const inputText = useThemeColor({}, 'inputText');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');

  useEffect(() => {
    if (data) {
      setBankName(data.bankName ?? '');
      setAccountName(data.accountTitle ?? '');
      setAccountNumber(data.accountNumber ?? '');
      setIban(data.iban ?? '');
    }
  }, [data]);

  const handleSave = async () => {
    if (!bankName.trim() || !accountName.trim() || !accountNumber.trim() || !iban.trim()) {
      alert('Bank name, account name, account no, and IBAN are required.');
      return;
    }
    setSaving(true);
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

        <ThemedView style={[styles.card, { borderColor, backgroundColor: surface }]}>
          <ThemedText style={styles.label}>Bank Name</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, backgroundColor: inputBackground, color: inputText }]}
            value={bankName}
            onChangeText={setBankName}
            placeholder="Meezan Bank"
            placeholderTextColor={muted}
          />
          <ThemedText style={styles.label}>Account Name</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, backgroundColor: inputBackground, color: inputText }]}
            value={accountName}
            onChangeText={setAccountName}
            placeholder="Bazaar Store"
            placeholderTextColor={muted}
          />
          <ThemedText style={styles.label}>Account No</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, backgroundColor: inputBackground, color: inputText }]}
            value={accountNumber}
            onChangeText={setAccountNumber}
            placeholder="1234-5678-9012"
            placeholderTextColor={muted}
          />
          <ThemedText style={styles.label}>IBAN</ThemedText>
          <TextInput
            style={[styles.input, { borderColor, backgroundColor: inputBackground, color: inputText }]}
            value={iban}
            onChangeText={setIban}
            placeholder="PKxx...."
            placeholderTextColor={muted}
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
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
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
