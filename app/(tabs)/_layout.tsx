import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../src/theme';

function TabBarIcon({ name, focused }: { name: string; focused: boolean }) {
  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <Ionicons 
        name={name as any} 
        size={24} 
        color={focused ? theme.colors.primary : theme.colors.onSurfaceVariant} 
        style={focused ? { transform: [{ scale: 1.1 }] } : undefined}
      />
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          ...styles.tabBar,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? 0 : 8,
        },
        tabBarShowLabel: true,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Today',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? "today" : "today-outline"} focused={focused} />,
        }} 
      />
      <Tabs.Screen 
        name="schedule" 
        options={{ 
          title: 'Schedule',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? "calendar" : "calendar-outline"} focused={focused} />,
        }} 
      />
      <Tabs.Screen 
        name="courses" 
        options={{ 
          title: 'Courses',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? "school" : "school-outline"} focused={focused} />,
        }} 
      />
      <Tabs.Screen 
        name="constraints" 
        options={{ 
          title: 'Rules',
          tabBarIcon: ({ focused }) => <TabBarIcon name={focused ? "settings" : "settings-outline"} focused={focused} />,
        }} 
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    marginTop: 2,
  },
  iconContainer: {
    width: 40,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  iconContainerActive: {
    backgroundColor: theme.colors.primaryContainer,
  },
});
