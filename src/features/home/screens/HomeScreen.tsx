import { useEffect } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Canvas, Circle, Group, LinearGradient, RoundedRect, vec } from '@shopify/react-native-skia';
import { Button } from '../../../components/Button';
import { colors, spacing } from '../../../theme';
import type { RootStackParamList } from '../../../navigation/types';
import { useImagePicker } from '../hooks/useImagePicker';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

const LOGO = 128;

export function HomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { pick, loading, error, clearError } = useImagePicker();

  useEffect(() => {
    if (error) {
      Alert.alert('Could not open image', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, clearError]);

  const onSelectImage = async () => {
    const image = await pick();
    if (image) {
      navigation.navigate('Editor', { image });
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.hero}>
        <Canvas style={{ width: LOGO, height: LOGO }}>
          <Group>
            <RoundedRect x={4} y={4} width={LOGO - 8} height={LOGO - 8} r={28}>
              <LinearGradient start={vec(0, 0)} end={vec(LOGO, LOGO)} colors={[colors.primary, colors.accent]} />
            </RoundedRect>
            <Circle cx={LOGO / 2} cy={LOGO / 2} r={LOGO * 0.16} color={colors.background} />
          </Group>
        </Canvas>
        <Text style={styles.title}>GFL Image Editor</Text>
        <Text style={styles.subtitle}>Pick a photo, drop it in a frame, make it yours.</Text>
      </View>

      <Button label="Select Image" onPress={onSelectImage} loading={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
