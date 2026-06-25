import { StyleSheet, View } from 'react-native';

import { ValidatingTextInput } from '@/components/validating-text-input';
import { FIELD_LIMITS } from '@/constants/fieldLimits';

type NameFieldsRowProps = {
  firstName: string;
  lastName: string;
  onFirstNameChange: (text: string) => void;
  onLastNameChange: (text: string) => void;
  firstNameError?: string;
  lastNameError?: string;
};

export function NameFieldsRow({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  firstNameError,
  lastNameError,
}: NameFieldsRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <ValidatingTextInput
          label="First name"
          placeholder="First name"
          value={firstName}
          onChangeText={onFirstNameChange}
          maxLength={FIELD_LIMITS.firstName}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="givenName"
          error={firstNameError}
        />
      </View>
      <View style={styles.field}>
        <ValidatingTextInput
          label="Last name"
          placeholder="Last name"
          value={lastName}
          onChangeText={onLastNameChange}
          maxLength={FIELD_LIMITS.lastName}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="familyName"
          error={lastNameError}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  field: {
    flex: 1,
    minWidth: 0,
  },
});
