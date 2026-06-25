import { Image } from "expo-image";
import { useState } from "react";
import {
  ImageSourcePropType,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
} from "react-native";

import { SkeletonBlock } from "@/components/skeleton-block";

type RemoteImageProps = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  contentFit?: "cover" | "contain" | "fill";
  fallbackSource?: ImageSourcePropType;
  recyclingKey?: string;
};

export function RemoteImage({
  uri,
  style,
  contentFit = "cover",
  fallbackSource,
  recyclingKey,
}: RemoteImageProps) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(Boolean(uri));
  const [failed, setFailed] = useState(false);

  if (!uri) {
    if (!fallbackSource) {
      return null;
    }
    return (
      <Image source={fallbackSource} style={style} contentFit={contentFit} />
    );
  }

  const source = failed && fallbackSource ? fallbackSource : { uri };

  return (
    <View
      style={[style, styles.wrapper]}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        setLayout({ width, height });
      }}>
      {loading && layout.height > 0 ? (
        <SkeletonBlock width={layout.width} height={layout.height} borderRadius={0} />
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
    overflow: "hidden",
  },
});
