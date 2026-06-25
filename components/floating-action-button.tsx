import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeColor } from '@/hooks/use-theme-color';

export const FAB_SIZE = 56;
export const FAB_GAP = 12;
export const TAB_BAR_HEIGHT = 56;
export const WHATSAPP_GREEN = '#25D366';

export function fabStackBottomPadding(fabCount: number): number {
  if (fabCount <= 0) return 0;
  return fabCount * FAB_SIZE + Math.max(0, fabCount - 1) * FAB_GAP + 16;
}

type FloatingActionButtonProps = {
  onPress: () => void;
  accessibilityLabel: string;
  backgroundColor: string;
  iconColor: string;
  iconName: keyof typeof Ionicons.glyphMap;
  borderColor: string;
  iconSize?: number;
  helpMessage?: string;
};

export function FloatingActionButton({
  onPress,
  accessibilityLabel,
  backgroundColor,
  iconColor,
  iconName,
  borderColor,
  iconSize = 24,
  helpMessage,
}: FloatingActionButtonProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const shadow = useThemeColor({}, 'text');
  const border = useThemeColor({}, 'border');
  const surface = useThemeColor({}, 'surface');
  const primary = useThemeColor({}, 'primary');
  const primaryText = useThemeColor({}, 'primaryText');
  const muted = useThemeColor({}, 'muted');

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [
          styles.fab,
          { backgroundColor, borderColor, shadowColor: shadow },
          pressed && styles.fabPressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}>
        <View style={styles.iconSlot}>
          <Ionicons name={iconName} size={iconSize} color={iconColor} />
        </View>
      </Pressable>

      {helpMessage ? (
        <>
          <Pressable
            style={[styles.helpBadge, { backgroundColor: surface, borderColor: border }]}
            onPress={() => setHelpOpen(true)}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={`What is this? ${helpMessage}`}>
            <Ionicons name="help" size={13} color={primary} />
          </Pressable>

          <Modal visible={helpOpen} transparent animationType="fade" onRequestClose={() => setHelpOpen(false)}>
            <View style={styles.modalRoot}>
              <Pressable style={styles.backdrop} onPress={() => setHelpOpen(false)} accessibilityLabel="Close" />
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: surface,
                    borderColor: border,
                    marginBottom: Math.max(insets.bottom, 16) + 72,
                    marginRight: Math.max(insets.right, 16),
                  },
                ]}>
                <ThemedText type="defaultSemiBold">What is this?</ThemedText>
                <ThemedText style={{ color: muted, lineHeight: 20 }}>{helpMessage}</ThemedText>
                <Pressable
                  style={[styles.okButton, { backgroundColor: primary }]}
                  onPress={() => setHelpOpen(false)}>
                  <ThemedText style={{ color: primaryText, fontWeight: '600' }}>Got it</ThemedText>
                </Pressable>
              </View>
            </View>
          </Modal>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  fabPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.96 }],
  },
  iconSlot: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  bubble: {
    maxWidth: 280,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginHorizontal: 16,
  },
  okButton: {
    alignSelf: 'flex-end',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginTop: 4,
  },
});
