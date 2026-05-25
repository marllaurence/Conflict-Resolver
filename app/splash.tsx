import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { theme } from '../src/theme';

const { width, height } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(barAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: false,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const barWidth = barAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '33%'],
  });

  return (
    <View style={styles.container}>
      {/* Grid pattern overlay */}
      <View style={styles.gridPattern} />

      {/* Gradient glow */}
      <View style={styles.gradientGlow} />

      {/* Abstract geometric blurs */}
      <View style={styles.blurTopLeft} />
      <View style={styles.blurBottomRight} />

      {/* Central content */}
      <Animated.View
        style={[
          styles.centerContent,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo container */}
        <View style={styles.logoContainer}>
          <View style={styles.logoRing}>
            <View style={styles.logoInner}>
              <Text style={styles.logoIcon}>CR</Text>
            </View>
          </View>
          <View style={styles.logoEcho} />
        </View>

        {/* App name */}
        <Text style={styles.title}>ConflictResolver</Text>

        {/* Divider with label */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.subtitle}>Schedulize</Text>
          <View style={styles.dividerLine} />
        </View>
      </Animated.View>

      {/* Bottom footer */}
      <View style={styles.bottomFooter}>
        <Text style={styles.tagline}>Powered by backtracking optimization</Text>

        {/* Loading bar */}
        <View style={styles.loadingTrack}>
          <Animated.View style={[styles.loadingBar, { width: barWidth }]} />
        </View>
      </View>

      {/* Decorative bars - left side */}
      <View style={styles.decorativeBars}>
        <View style={[styles.decoBar, { height: 64, backgroundColor: theme.colors.primary }]} />
        <View style={[styles.decoBar, { height: 32, backgroundColor: theme.colors.outline }]} />
        <View style={[styles.decoBar, { height: 96, backgroundColor: theme.colors.primaryContainer }]} />
        <View style={[styles.decoBar, { height: 48, backgroundColor: theme.colors.outline }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
  gridPattern: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  gradientGlow: {
    position: 'absolute',
    width: width * 1.5,
    height: height * 1.5,
    top: -width * 0.25,
    left: -width * 0.25,
    borderRadius: width,
    backgroundColor: theme.colors.primary,
    opacity: 0.03,
  },
  blurTopLeft: {
    position: 'absolute',
    width: 384,
    height: 384,
    top: -96,
    left: -96,
    borderRadius: 192,
    backgroundColor: theme.colors.primary,
    opacity: 0.05,
  },
  blurBottomRight: {
    position: 'absolute',
    width: 500,
    height: 500,
    bottom: -192,
    right: -192,
    borderRadius: 250,
    backgroundColor: theme.colors.primaryContainer,
    opacity: 0.05,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 48,
    position: 'relative',
    alignItems: 'center',
  },
  logoRing: {
    width: 96,
    height: 96,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainer,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.6,
  },
  logoInner: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: `${theme.colors.surfaceContainer}99`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIcon: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: -1,
  },
  logoEcho: {
    position: 'absolute',
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: theme.colors.primary,
    opacity: 0.1,
    top: -16,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.onSurface,
    letterSpacing: -2,
    marginBottom: 8,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    opacity: 0.6,
  },
  dividerLine: {
    width: 32,
    height: 1,
    backgroundColor: theme.colors.outline,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  tagline: {
    fontSize: 10,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    letterSpacing: 3,
    textTransform: 'uppercase',
    opacity: 0.8,
    marginBottom: 32,
  },
  loadingTrack: {
    width: 192,
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
    opacity: 0.4,
    borderRadius: 1,
    overflow: 'hidden',
  },
  loadingBar: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    opacity: 0.6,
    borderRadius: 1,
  },
  decorativeBars: {
    position: 'absolute',
    left: 48,
    top: '50%',
    transform: [{ translateY: -128 }],
    gap: 16,
    opacity: 0.2,
  },
  decoBar: {
    width: 4,
    borderRadius: 2,
  },
});
