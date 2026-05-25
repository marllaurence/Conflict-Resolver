import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { runStudentSolver } from '../../src/algorithm/workerBridge';
import { GlassCard } from '../../src/components/GlassCard';
import { useStore } from '../../src/store/useStore';
import { COURSE_COLORS, theme } from '../../src/theme';

export default function StudentDashboard() {
  const router = useRouter();
  const { cart, preferences, updatePreferences, isSolving, generatedSchedules, constraints, instructorConstraints, setSelectedScheduleIndex } = useStore();

  const handleGenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    runStudentSolver();
  };

  const togglePreference = (key: keyof typeof preferences, value: boolean) => {
    Haptics.selectionAsync();
    updatePreferences({ [key]: value });
    if (cart.length > 0 && !isSolving) {
      runStudentSolver();
    }
  };

  const activeHardConstraints = [...constraints, ...instructorConstraints].filter(c => c.severity === 'hard' && c.enabled);

  const getCourseColor = (courseId: string): { bg: string; text: string } => {
    const index = Math.abs(courseId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % COURSE_COLORS.length;
    return COURSE_COLORS[index];
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f9f9fe', '#e8e8ed']} style={styles.gradient}>
        <ScrollView 
          stickyHeaderIndices={[0]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ENHANCED HEADER */}
          <View style={styles.header}>
            <LinearGradient
              colors={['rgba(0,88,188,0.08)', 'rgba(0,88,188,0.02)']}
              style={styles.headerGradient}
            >
              <View style={styles.headerRow}>
                <View style={styles.avatarWrapper}>
                  <View style={styles.avatar}>
                    <LinearGradient 
                      colors={[theme.colors.primary, '#6E8EFb']} 
                      style={styles.avatarGradient}
                    >
                      <Ionicons name="person" size={20} color="#fff" />
                    </LinearGradient>
                    <View style={styles.avatarRing} />
                  </View>
                </View>
                <View style={styles.headerContent}>
                  <Text style={styles.headerGreeting}>Good morning</Text>
                  <Text style={styles.headerTitle}>Schedule Builder</Text>
                </View>
              </View>
              <View style={styles.headerStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{cart.length}</Text>
                  <Text style={styles.statLabel}>Courses</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{generatedSchedules.length}</Text>
                  <Text style={styles.statLabel}>Schedules</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.constraintsBanner}>
            <View style={styles.constraintItem}>
              <View style={[styles.constraintIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                <Ionicons name="walk" size={16} color={theme.colors.primary} />
              </View>
              <Text style={styles.constraintText}>30 min transit</Text>
            </View>
            {instructorConstraints.length > 0 && (
              <View style={styles.constraintItem}>
                <View style={[styles.constraintIcon, { backgroundColor: theme.colors.tertiaryContainer }]}>
                  <Ionicons name="person" size={16} color={theme.colors.tertiary} />
                </View>
                <Text style={styles.constraintText}>{instructorConstraints.length} Instructor</Text>
              </View>
            )}
          </View>

          <GlassCard variant="elevated" elevation={2} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="book" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Course Selection</Text>
              </View>
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cart.length}</Text>
              </View>
            </View>
            
            {cart.length === 0 ? (
              <Text style={styles.emptyCartText}>
                No courses selected yet. Browse the catalog to add courses.
              </Text>
            ) : (
              <View style={styles.courseList}>
                {cart.map((courseId) => {
                  const course = useStore.getState().catalog.find(c => c.id === courseId);
                  if (!course) return null;
                  const color = getCourseColor(courseId);
                  return (
                    <View key={courseId} style={styles.courseChip}>
                      <View style={[styles.courseChipDot, { backgroundColor: color.bg }]} />
                      <Text style={styles.courseChipText}>{course.code}</Text>
                      <TouchableOpacity 
                        onPress={() => useStore.getState().toggleCartItem(courseId)}
                        style={styles.courseChipRemove}
                      >
                        <Ionicons name="close" size={14} color={theme.colors.onSurfaceVariant} />
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => router.push('/(tabs)/courses')}
            >
              <Ionicons name="grid-outline" size={18} color={theme.colors.primary} />
              <Text style={styles.browseButtonText}>Browse Catalog</Text>
              <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </GlassCard>

          <GlassCard variant="elevated" elevation={2} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="options" size={20} color={theme.colors.primary} />
                <Text style={styles.sectionTitle}>Soft Preferences</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/constraints')}>
                <Text style={styles.manageLink}>Manage</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionHint}>
              Score adjustments for valid schedules
            </Text>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceLabel}>Prefer Mornings</Text>
                <Text style={styles.preferenceSubtext}>Classes before noon</Text>
              </View>
              <Switch 
                value={preferences.preferMornings} 
                onValueChange={(v) => togglePreference('preferMornings', v)}
                trackColor={{ false: theme.colors.surfaceContainerHigh, true: theme.colors.primaryContainer }}
                thumbColor={preferences.preferMornings ? theme.colors.primary : theme.colors.outline}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceLabel}>Prefer Afternoons</Text>
                <Text style={styles.preferenceSubtext}>Classes after noon</Text>
              </View>
              <Switch 
                value={preferences.preferAfternoons} 
                onValueChange={(v) => togglePreference('preferAfternoons', v)}
                trackColor={{ false: theme.colors.surfaceContainerHigh, true: theme.colors.primaryContainer }}
                thumbColor={preferences.preferAfternoons ? theme.colors.primary : theme.colors.outline}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceLabel}>Minimize Gaps</Text>
                <Text style={styles.preferenceSubtext}>Compact scheduling</Text>
              </View>
              <Switch 
                value={preferences.minimizeGaps} 
                onValueChange={(v) => togglePreference('minimizeGaps', v)}
                trackColor={{ false: theme.colors.surfaceContainerHigh, true: theme.colors.primaryContainer }}
                thumbColor={preferences.minimizeGaps ? theme.colors.primary : theme.colors.outline}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceLabel}>Cluster to Fewer Days</Text>
                <Text style={styles.preferenceSubtext}>Free up entire days</Text>
              </View>
              <Switch 
                value={preferences.clusterDays} 
                onValueChange={(v) => togglePreference('clusterDays', v)}
                trackColor={{ false: theme.colors.surfaceContainerHigh, true: theme.colors.primaryContainer }}
                thumbColor={preferences.clusterDays ? theme.colors.primary : theme.colors.outline}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceLabel}>Building Proximity</Text>
                <Text style={styles.preferenceSubtext}>Same/adjacent buildings</Text>
              </View>
              <Switch 
                value={preferences.buildingProximity} 
                onValueChange={(v) => togglePreference('buildingProximity', v)}
                trackColor={{ false: theme.colors.surfaceContainerHigh, true: theme.colors.primaryContainer }}
                thumbColor={preferences.buildingProximity ? theme.colors.primary : theme.colors.outline}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceLabel}>Minimize Extremes</Text>
                <Text style={styles.preferenceSubtext}>Avoid 7am or 7pm+</Text>
              </View>
              <Switch 
                value={preferences.minimizeExtremes} 
                onValueChange={(v) => togglePreference('minimizeExtremes', v)}
                trackColor={{ false: theme.colors.surfaceContainerHigh, true: theme.colors.primaryContainer }}
                thumbColor={preferences.minimizeExtremes ? theme.colors.primary : theme.colors.outline}
              />
            </View>

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceInfo}>
                <Text style={styles.preferenceLabel}>Balanced Daily Load</Text>
                <Text style={styles.preferenceSubtext}>Even class distribution</Text>
              </View>
              <Switch 
                value={preferences.balancedLoad} 
                onValueChange={(v) => togglePreference('balancedLoad', v)}
                trackColor={{ false: theme.colors.surfaceContainerHigh, true: theme.colors.primaryContainer }}
                thumbColor={preferences.balancedLoad ? theme.colors.primary : theme.colors.outline}
              />
            </View>
          </GlassCard>

          <TouchableOpacity 
            style={[
              styles.generateButton,
              cart.length === 0 && styles.generateButtonDisabled
            ]}
            onPress={handleGenerate} 
            disabled={cart.length === 0 || isSolving}
          >
            {isSolving ? (
              <ActivityIndicator color={theme.colors.onPrimary} />
            ) : (
              <>
                <Ionicons name="sparkles" size={20} color={theme.colors.onPrimary} />
                <Text style={styles.generateButtonText}>Generate Schedules</Text>
              </>
            )}
          </TouchableOpacity>

          {generatedSchedules.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.resultsTitle}>
                Top {generatedSchedules.length} Schedule Options
              </Text>
              
              {generatedSchedules.map((schedule, index) => (
                <GlassCard key={schedule.id} variant="elevated" elevation={2} style={styles.resultCard}>
                  <View style={styles.resultHeader}>
                    <View style={styles.resultTitleRow}>
                      <Text style={styles.resultTitle}>Option {index + 1}</Text>
                    </View>
                  </View>

                  <View style={styles.matchDetails}>
                    {schedule.matchDetails.map((detail, i) => (
                      <View key={i} style={styles.matchItem}>
                        <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                        <Text style={styles.matchText}>{detail}</Text>
                      </View>
                    ))}
                    {schedule.conflicts.map((conflict, i) => (
                      <View key={`conflict_${i}`} style={styles.matchItem}>
                        <Ionicons name="warning" size={16} color={theme.colors.error} />
                        <Text style={[styles.matchText, { color: theme.colors.error }]} numberOfLines={2}>
                          {conflict.message}
                        </Text>
                      </View>
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedScheduleIndex(index);
                      router.push('/(tabs)/schedule');
                    }}
                  >
                    <Text style={styles.viewButtonText}>View Schedule</Text>
                    <Ionicons name="arrow-forward" size={16} color={theme.colors.primary} />
                  </TouchableOpacity>
                </GlassCard>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  
  // --- ENHANCED HEADER STYLES ---
  header: {
    paddingTop: 0,
    paddingHorizontal: 0,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  headerGradient: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    marginRight: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarRing: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: 'rgba(0,88,188,0.2)',
  },
  headerContent: {
    flex: 1,
  },
  headerGreeting: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.primary,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.onSurface,
    letterSpacing: -0.5,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,88,188,0.06)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0,88,188,0.15)',
  },
  // ---------------------------------

  constraintsBanner: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
    marginTop: 16, 
  },
  constraintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 20,
  },
  constraintIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  constraintText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  sectionHint: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 16,
  },
  manageLink: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  cartBadge: {
    backgroundColor: theme.colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  emptyCartText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
    marginBottom: 16,
  },
  courseList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  courseChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingRight: 8,
    paddingVertical: 6,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    gap: 6,
  },
  courseChipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  courseChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
  courseChipRemove: {
    padding: 2,
  },
  browseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 12,
    gap: 8,
  },
  browseButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  preferenceInfo: {},
  preferenceLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.onSurface,
  },
  preferenceSubtext: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  generateButtonDisabled: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    shadowOpacity: 0,
    elevation: 0,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  resultsSection: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
    marginBottom: 16,
  },
  resultCard: {
    padding: 16,
    marginBottom: 12,
  },
  resultHeader: {
    marginBottom: 12,
  },
  resultTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  scoreBadge: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreBadgeWarning: {
    backgroundColor: theme.colors.tertiaryContainer,
  },
  scoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  scoreTextWarning: {
    color: theme.colors.tertiary,
  },
  matchDetails: {
    gap: 8,
    marginBottom: 16,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  matchText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    flex: 1,
    lineHeight: 18,
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 12,
    gap: 6,
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
});