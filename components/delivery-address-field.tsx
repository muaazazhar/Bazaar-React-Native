import { useState } from 'react';

import { ThemedButton } from '@/components/themed-button';
import { ThemedText } from '@/components/themed-text';
import { ValidatingTextInput } from '@/components/validating-text-input';
import { FIELD_LIMITS } from '@/constants/fieldLimits';
import { useThemeColor } from '@/hooks/use-theme-color';
import { fetchAddressFromCurrentLocation } from '@/utils/currentLocationAddress';

type DeliveryAddressFieldProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string | null;
  onClearError?: () => void;
  onLocationError?: (message: string) => void;
  onLocationSuccess?: () => void;
  hint?: string;
  label?: string;
  disabled?: boolean;
};

export function DeliveryAddressField({
  value,
  onChange,
  error,
  onClearError,
  onLocationError,
  onLocationSuccess,
  hint,
  label = 'Delivery address',
  disabled = false,
}: DeliveryAddressFieldProps) {
  const [locating, setLocating] = useState(false);
  const muted = useThemeColor({}, 'muted');

  const handleUseCurrentLocation = async () => {
    setLocating(true);
    try {
      onLocationSuccess?.();
      onChange(await fetchAddressFromCurrentLocation());
      onClearError?.();
    } catch (err) {
      onLocationError?.(
        err instanceof Error ? err.message : 'Could not fetch current location and address.',
      );
    } finally {
      setLocating(false);
    }
  };

  return (
    <>
      {hint ? <ThemedText style={{ color: muted, fontSize: 13 }}>{hint}</ThemedText> : null}
      <ValidatingTextInput
        label={label}
        placeholder="House 12, Street 4, City"
        value={value}
        onChangeText={(text) => {
          onChange(text);
          if (error) onClearError?.();
        }}
        maxLength={FIELD_LIMITS.address}
        multiline
        error={error ?? undefined}
        editable={!disabled}
      />
      <ThemedButton
        variant="secondary"
        label={locating ? 'Fetching location...' : 'Use current location'}
        loading={locating}
        disabled={disabled || locating}
        onPress={() => void handleUseCurrentLocation()}
      />
    </>
  );
}
