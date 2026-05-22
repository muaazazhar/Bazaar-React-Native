import { Image } from 'expo-image';
import { useState } from 'react';
import {
  ActivityIndicator,
  ImageSourcePropType,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
} from 'react-native';

import { useThemeColor } from '@/hooks/use-theme-color';

type RemoteImageProps = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: 'cover' | 'contain' | 'fill';
  fallbackSource?: ImageSourcePropType;
  recyclingKey?: string;
};

export function RemoteImage({
  uri,
  style,
  contentFit = 'cover',
  fallbackSource,
  recyclingKey,
}: RemoteImageProps) {
  const surfaceAlt = useThemeColor({}, 'surfaceAlt');
  const muted = useThemeColor({}, 'muted');
  const [loading, setLoading] = useState(Boolean(uri));
  const [failed, setFailed] = useState(false);

  if (!uri) {
    if (!fallbackSource) {
      return null;
    }
    return <Image source={fallbackSource} style={style} contentFit={contentFit} />;
  }

  const source = failed && fallbackSource ? fallbackSource : { uri };

  return (
    <View style={[style, styles.wrapper]}>
      {loading ? (
        <View style={[styles.placeholder, { backgroundColor: surfaceAlt }]}>
          <ActivityIndicator size="small" color={muted} />
        </View>
      ) : null}
      <Image
        source={source}
        style={StyleSheet.absoluteFill}
        contentFit={contentFit}
        cachePolicy="memory-disk"
        transition={200}
        recyclingKey={recyclingKey ?? uri}
        onLoadStart={() => {
          setLoading(true);
          setFailed(false);
        }}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setFailed(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
