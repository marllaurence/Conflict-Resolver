import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '../src/components/GlassCard';
import { useStore } from '../src/store/useStore';
import { theme } from '../src/theme';
import { Conflict } from '../src/types';

const getConflictIcon = (type: Conflict['type']): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'TIME_OVERLAP': return 'time';
    case 'BUILDING_TRAVEL': return 'walk';
    case 'INSTRUCTOR_UNAVAILABLE': return 'person';
    case 'INSTRUCTOR_CONFLICT': return 'person';
    case 'ROOM_CONFLICT': return 'business';
    case 'ROOM_CAPACITY': return 'people';
    case 'PREREQUISITE_ORDERING': return 'book';
    case 'SECTION_UNIQUENESS': return 'layers';
    case 'MINIMIZE_GAPS': return 'timer';
    case 'CLUSTER_DAYS': return 'calendar';
    case 'BUILDING_PROXIMITY': return 'location';
    case 'MINIMIZE_EXTREMES': return 'time';
    case 'BALANCED_LOAD': return 'scale';
    default: return 'warning';
  }
};

export default function ConflictsScreen() {
  const router = useRouter();
  const { generatedSchedules, catalog } = useStore();

  const allConflicts = generatedSchedules.flatMap(s => s.conflicts);

  if (allConflicts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="checkmark-circle" size={64} color={theme.colors.success} />
          </View>
          <Text style={styles.emptyTitle}>No Conflicts</Text>
          <Text style={styles.emptyText}>Your schedule satisfies all constraints.</Text>
          
          <TouchableOpacity 
            style={styles.viewBtn}
            onPress={() => router.push('/(tabs)/schedule')}
          >
            <Text style={styles.viewBtnText}>View Schedule</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Ionicons name="warning" size={24} color={theme.colors.error} />
          <Text style={styles.headerTitle}>Conflict Report</Text>
        </View>
        <Text style={styles.subheader}>These are preference warnings - schedules are still valid</Text>
      </View>

      {allConflicts.map((conflict, index) => {
        const affectedCourses = catalog.filter(c => 
          conflict.sectionIds.some(sId => c.sections.some(s => s.id === sId))
        );
        
        return (
          <GlassCard key={`${conflict.id}_${index}`} variant="elevated" style={styles.conflictCard}>
            <View style={styles.cardHeader}>
              <View style={[
                styles.iconBadge, 
                { backgroundColor: conflict.severity === 'hard' ? theme.colors.errorContainer : theme.colors.tertiaryContainer }
              ]}>
                <Ionicons 
                  name={getConflictIcon(conflict.type)} 
                  size={20} 
                  color={conflict.severity === 'hard' ? theme.colors.error : theme.colors.tertiary} 
                />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.conflictType}>
                  {conflict.type.replace(/_/g, ' ')}
                </Text>
                <View style={[
                  styles.severityBadge,
                  { backgroundColor: conflict.severity === 'hard' ? theme.colors.errorContainer : theme.colors.tertiaryContainer }
                ]}>
                  <Text style={[
                    styles.severityText, 
                    { color: conflict.severity === 'hard' ? theme.colors.error : theme.colors.tertiary }
                  ]}>
                    {conflict.severity.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>
            
            <Text style={styles.messageText}>{conflict.message}</Text>
            
            <View style={styles.affectedSection}>
              <Text style={styles.affectedLabel}>Affected Courses:</Text>
              <Text style={styles.affectedCourses}>
                {affectedCourses.map(c => c.code).join(', ') || 'Multiple courses'}
              </Text>
            </View>

            {conflict.suggestion && (
              <View style={styles.suggestionBox}>
                <Ionicons name="bulb" size={16} color={theme.colors.tertiary} />
                <Text style={styles.suggestionText}>{conflict.suggestion}</Text>
              </View>
            )}
          </GlassCard>
        );
      })}

      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => router.push('/(tabs)/constraints')}
        >
          <Ionicons name="settings" size={18} color={theme.colors.onSurface} />
          <Text style={styles.actionBtnText}>Adjust Rules</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionBtn, styles.primaryBtn]}
          onPress={() => router.push('/(tabs)/schedule')}
        >
          <Ionicons name="grid" size={18} color={theme.colors.onPrimary} />
          <Text style={styles.primaryBtnText}>View Schedule</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: 20, paddingBottom: 40 },
  
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: theme.colors.background,
    padding: 20
  },
  emptyContent: { alignItems: 'center', maxWidth: 280 },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.onSurface, marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: theme.colors.onSurfaceVariant, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  
  viewBtn: { 
    backgroundColor: theme.colors.primary, 
    paddingHorizontal: 24, 
    paddingVertical: 14, 
    borderRadius: 24 
  },
  viewBtnText: { color: theme.colors.onPrimary, fontWeight: '700', fontSize: 14 },
  
  header: { marginBottom: 20, paddingTop: 60 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  subheader: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginTop: 4 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: theme.colors.onSurface },
  
  conflictCard: { marginBottom: 16, padding: 16 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  iconBadge: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  titleContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  conflictType: { fontSize: 14, fontWeight: '700', color: theme.colors.onSurface, textTransform: 'capitalize' },
  severityBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  severityText: { fontSize: 10, fontWeight: '700' },
  
  messageText: { fontSize: 14, color: theme.colors.onSurfaceVariant, marginBottom: 12, lineHeight: 20 },
  
  affectedSection: { flexDirection: 'row', marginBottom: 12 },
  affectedLabel: { fontSize: 12, color: theme.colors.onSurfaceVariant, marginRight: 8 },
  affectedCourses: { fontSize: 12, color: theme.colors.onSurface, fontWeight: '600' },
  
  suggestionBox: { 
    flexDirection: 'row', 
    alignItems: 'center',
    backgroundColor: theme.colors.tertiaryContainer, 
    padding: 12, 
    borderRadius: 12,
  },
  suggestionText: { fontSize: 13, color: theme.colors.onTertiaryContainer, marginLeft: 8, flex: 1 },
  
  actions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  actionBtn: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    backgroundColor: theme.colors.surfaceContainerHigh, 
    padding: 14, 
    borderRadius: 12,
    gap: 8
  },
  actionBtnText: { color: theme.colors.onSurface, fontWeight: '600', fontSize: 14 },
  primaryBtn: { backgroundColor: theme.colors.primary },
  primaryBtnText: { color: theme.colors.onPrimary, fontWeight: '700', fontSize: 14 }
});
