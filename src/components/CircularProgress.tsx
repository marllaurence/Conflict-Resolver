import React from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedProps, withSpring } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '../theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface Props { progress: number; size?: number; strokeWidth?: number; }

export const CircularProgress = ({ progress, size = 120, strokeWidth = 8 }: Props) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: withSpring(circumference - progress * circumference, { damping: 20, stiffness: 90 }),
  }));

  return (
    <View style={{ width: size, height: size, transform: [{ rotate: '-90deg' }] }}>
      <Svg width={size} height={size}>
        <Circle stroke={theme.colors.surface} fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} />
        <AnimatedCircle stroke={theme.colors.primary} fill="none" cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} strokeDasharray={circumference} animatedProps={animatedProps} strokeLinecap="round" />
      </Svg>
    </View>
  );
};