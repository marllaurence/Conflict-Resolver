import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { theme } from '../theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'filled' | 'outlined';
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
}

export const GlassCard = ({ 
  children, 
  style, 
  variant = 'elevated',
  elevation = 1 
}: Props) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'filled':
        return {
          backgroundColor: theme.colors.surfaceContainerLow,
          borderWidth: 0,
          shadowOpacity: 0,
        };
      case 'outlined':
        return {
          backgroundColor: theme.colors.surfaceContainerLowest,
          borderWidth: 1,
          borderColor: theme.colors.outlineVariant,
          shadowOpacity: 0,
        };
      case 'elevated':
      default:
        return {
          backgroundColor: theme.colors.surfaceContainerLowest,
          borderWidth: 0,
          shadowOpacity: 0.1 + (elevation * 0.02),
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[
      styles.container, 
      variantStyles,
      variant === 'elevated' && styles[`elevation${elevation}`],
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    borderRadius: theme.radius.lg,
  },
  elevation1: {
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  elevation2: {
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  elevation3: {
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 3,
  },
  elevation4: {
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  elevation5: {
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 5,
  },
  elevation0: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 0,
    elevation: 0,
  },
});
