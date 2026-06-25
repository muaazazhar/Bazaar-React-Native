import * as Haptics from 'expo-haptics';
import { router, useSegments } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  FAB_GAP,
  FloatingActionButton,
  TAB_BAR_HEIGHT,
  WHATSAPP_GREEN,
} from '@/components/floating-action-button';
import { useNotification } from '@/context/NotificationContext';
import { useThemeColor } from '@/hooks/use-theme-color';
import { useGetStoreSettingsQuery } from '@/store/api/storeSettingsApi';
import { useAppSelector } from '@/store/hooks';
import { isAdminScreen, isAuthFlowScreen } from '@/utils/authRoute';
import { notifyError } from '@/utils/inAppNotify';
import { openWhatsAppChat } from '@/utils/whatsapp';

const CUSTOM_ORDER_HELP =
  "Can't find what you need? Use this to request items we don't list. Type your list and pay cash when it's delivered.";

function isCustomerHomeTab(segments: string[]): boolean {
  if (segments[0] !== '(tabs)') return false;
  const tab = segments[1];
  return !tab || tab === 'index';
}

function runHaptic(style: Haptics.ImpactFeedbackStyle) {
  if (Platform.OS !== 'web') {
    void Haptics.impactAsync(style);
  }
}

export function CustomerScreenOverlays() {
  const insets = useSafeAreaInsets();
  const segments = useSegments();
  const user = useAppSelector((state) => state.auth.user);
  const hydrated = useAppSelector((state) => state.auth.hydrated);
  const { notify } = useNotification();
  const { data: storeSettings } = useGetStoreSettingsQuery(undefined, {
    skip: !user || user.role === 'admin',
  });

  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');

  const whatsapp = storeSettings?.whatsappNumber?.trim() ?? '';
  const onHome = isCustomerHomeTab(segments);
  const visible =
    hydrated && Boolean(user) && user?.role !== 'admin' && !isAuthFlowScreen() && !isAdminScreen();

  if (!visible) {
    return null;
  }

  const inTabs = segments[0] === '(tabs)';
  const anchorStyle = {
    bottom: Math.max(insets.bottom, 12) + 8 + (inTabs ? TAB_BAR_HEIGHT : 0),
    right: 16 + Math.max(insets.right, 0),
  };

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <View pointerEvents="box-none" style={[styles.stack, anchorStyle]}>
        {onHome ? (
          <FloatingActionButton
            accessibilityLabel="Order items not listed in the store"
            backgroundColor={primary}
            iconColor={primaryText}
            borderColor={primary}
            iconName="create"
            helpMessage={CUSTOM_ORDER_HELP}
            onPress={() => {
              runHaptic(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/custom-order');
            }}
          />
        ) : null}

        {whatsapp ? (
          <FloatingActionButton
            accessibilityLabel="Contact us on WhatsApp"
            backgroundColor={surface}
            borderColor={border}
            iconColor={WHATSAPP_GREEN}
            iconName="logo-whatsapp"
            iconSize={28}
            onPress={() => {
              runHaptic(Haptics.ImpactFeedbackStyle.Light);
              void openWhatsAppChat(whatsapp).catch(() => {
                notifyError(notify, 'Could not open WhatsApp. Check that the store contact number is valid.', {
                  title: 'Contact us',
                });
              });
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    elevation: 30,
  },
  stack: {
    position: 'absolute',
    alignItems: 'center',
    gap: FAB_GAP,
  },
});
