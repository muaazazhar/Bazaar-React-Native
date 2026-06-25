import { Pressable, type GestureResponderEvent, type PressableProps } from 'react-native';

import { DEFAULT_PRESS_DEBOUNCE_MS, useDebouncedCallback } from '@/hooks/use-debounced-callback';

type DebouncedPressableProps = PressableProps & {
  debounceMs?: number;
};

export function DebouncedPressable({
  onPress,
  debounceMs = DEFAULT_PRESS_DEBOUNCE_MS,
  ...rest
}: DebouncedPressableProps) {
  const debouncedOnPress = useDebouncedCallback((event: GestureResponderEvent) => {
    onPress?.(event);
  }, debounceMs);

  return <Pressable {...rest} onPress={onPress ? debouncedOnPress : undefined} />;
}
