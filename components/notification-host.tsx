import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef } from 'react';
import { Animated, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useNotification, type NotificationVariant } from '@/context/NotificationContext';
import { useThemeColor } from '@/hooks/use-theme-color';

const VARIANT_CONFIG: Record<
  NotificationVariant,
  { icon: keyof typeof Ionicons.glyphMap; accentKey: 'primary' | 'danger' }
> = {
  success: { icon: 'checkmark-circle', accentKey: 'primary' },
  info: { icon: 'information-circle', accentKey: 'primary' },
  warning: { icon: 'alert-circle', accentKey: 'danger' },
  error: { icon: 'close-circle', accentKey: 'danger' },
};

export function NotificationHost() {
  const { current, dismiss } = useNotification();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-140)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const surface = useThemeColor({}, 'surface');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const muted = useThemeColor({}, 'muted');
  const primary = useThemeColor({}, 'primary');
  const danger = useThemeColor({}, 'danger');

  useEffect(() => {
    if (!current) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -140,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      return;
    }

    if (Platform.OS !== 'web') {
      if (current.variant === 'success') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (current.variant === 'warning' || current.variant === 'error') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    slideAnim.setValue(-140);
    opacityAnim.setValue(0);
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
        tension: 65,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [current?.id, slideAnim, opacityAnim, current]);

  if (!current) {
    return null;
  }

  const config = VARIANT_CONFIG[current.variant];
  const accent = config.accentKey === 'danger' ? danger : primary;

  return (
    <View style={[styles.host, { top: insets.top + 8 }]} pointerEvents="box-none">
      <Animated.View
        style={{
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        }}>
        <Pressable
          onPress={() => dismiss(current.id)}
          style={[styles.card, { backgroundColor: surface, borderColor: border, shadowColor: text }]}>
          <View style={[styles.accentBar, { backgroundColor: accent }]} />
          <View style={[styles.iconWrap, { borderColor: accent }]}>
            <Ionicons name={config.icon} size={22} color={accent} />
          </View>
          <View style={styles.textBlock}>
            <ThemedText type="defaultSemiBold" style={styles.title}>
              {current.title}
            </ThemedText>
            <ThemedText style={[styles.message, { color: muted }]}>{current.message}</ThemedText>
            {current.action ? (
              <Pressable
                onPress={() => {
                  current.action?.onPress();
                  dismiss(current.id);
                }}
                style={[styles.actionButton, { borderColor: accent }]}
                accessibilityRole="button">
                <ThemedText style={{ color: accent, fontSize: 13, fontWeight: '600' }}>
                  {current.action.label}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>
          <Pressable
            onPress={() => dismiss(current.id)}
            hitSlop={12}
            style={styles.closeButton}
            accessibilityRole="button"
            accessibilityLabel="Dismiss notification">
            <Ionicons name="close" size={18} color={muted} />
          </Pressable>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 9999,
    elevation: 12,
    alignItems: 'stretch',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingRight: 12,
    paddingLeft: 0,
    gap: 10,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
  },
  accentBar: {
    width: 4,
    alignSelf: 'stretch',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  textBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontSize: 15,
    lineHeight: 20,
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  closeButton: {
    padding: 4,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 6,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
});
