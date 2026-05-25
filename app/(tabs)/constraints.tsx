import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { useStore } from '../../src/store/useStore';
import { theme } from '../../src/theme';
import { Constraint } from '../../src/types';
import { SEED_INSTRUCTORS } from '../../src/utils/seed';

export default function ConstraintsScreen() {
  const { constraints, instructorConstraints, toggleConstraint, addInstructorConstraint, removeInstructorConstraint } = useStore();
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedInstructor, setSelectedInstructor] = useState<string | null>(null);
  const [transitTime, setTransitTime] = useState(30);

  const allConstraints = [...constraints, ...instructorConstraints];
  
  const softConstraints = allConstraints.filter(c => c.severity === 'soft');
  const transitConstraint = constraints.find(c => c.type === 'NO_BACK_TO_BACK_DIFFERENT_BUILDING');

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleConstraint(id);
  };

  const handleAddInstructorConstraint = () => {
    if (!selectedInstructor) return;

    const instructor = SEED_INSTRUCTORS.find(i => i.id === selectedInstructor);
    if (!instructor) return;

    const newConstraint: Constraint = {
      id: `instructor_${instructor.id}_transit`,
      name: `${instructor.name}: Travel Time`,
      description: 'Minimum travel time between buildings',
      type: 'NO_BACK_TO_BACK_DIFFERENT_BUILDING',
      severity: 'hard',
      enabled: true,
      params: { transitTimeMinutes: transitTime }
    };

    addInstructorConstraint(newConstraint);
    setModalVisible(false);
    setSelectedInstructor(null);
  };

  const handleRemoveInstructorConstraint = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    removeInstructorConstraint(id);
  };

  const renderSoftConstraint = (item: Constraint) => (
    <GlassCard 
      key={item.id}
      variant="elevated" 
      elevation={item.enabled ? 2 : 1}
      style={[styles.constraintCard, !item.enabled && styles.constraintCardDisabled]}
    >
      <View style={styles.constraintHeader}>
        <View style={styles.constraintInfo}>
          <View style={[
            styles.constraintIcon,
            { backgroundColor: theme.colors.tertiaryContainer }
          ]}>
            <Ionicons 
              name="options" as any
              size={18} 
              color={theme.colors.tertiary}
            />
          </View>
          <View style={styles.constraintText}>
            <Text style={styles.constraintName}>{item.name}</Text>
            <Text style={styles.constraintDescription}>{item.description}</Text>
          </View>
        </View>
        <Switch 
          value={item.enabled} 
          onValueChange={() => handleToggle(item.id)}
          trackColor={{ false: theme.colors.surfaceContainerHigh, true: theme.colors.primaryContainer }}
          thumbColor={item.enabled ? theme.colors.primary : theme.colors.outline}
        />
      </View>
    </GlassCard>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f9f9fe', '#e8e8ed']} style={styles.gradient}>
        <ScrollView 
          stickyHeaderIndices={[0]}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View>
              <Text style={styles.headerSubtitle}>Solver Configuration</Text>
              <Text style={styles.headerTitle}>Preferences</Text>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="walk" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Travel Time Between Buildings</Text>
            </View>
            <Text style={styles.sectionHint}>Required time to travel between buildings for back-to-back classes</Text>
            
            {transitConstraint && (
              <GlassCard variant="elevated" elevation={2} style={styles.transitCard}>
                <View style={styles.transitRow}>
                  <View style={styles.transitInfo}>
                    <Ionicons name="location" size={20} color={theme.colors.primary} />
                    <Text style={styles.transitLabel}>Minimum transit time</Text>
                  </View>
                  <Text style={styles.transitValue}>{(transitConstraint.params?.transitTimeMinutes as number) || 30} min</Text>
                </View>
                <Slider
                  style={{ width: '100%', height: 40 }}
                  minimumValue={5}
                  maximumValue={60}
                  step={5}
                  value={(transitConstraint.params?.transitTimeMinutes as number) || 30}
                  onValueChange={(val) => {
                    const store = useStore.getState();
                    const constraint = store.constraints.find(c => c.type === 'NO_BACK_TO_BACK_DIFFERENT_BUILDING');
                    if (constraint) {
                      constraint.params = { ...constraint.params, transitTimeMinutes: val };
                      store.toggleConstraint(constraint.id);
                      store.toggleConstraint(constraint.id);
                    }
                  }}
                  minimumTrackTintColor={theme.colors.primary}
                  maximumTrackTintColor={theme.colors.surfaceContainerHigh}
                  thumbTintColor={theme.colors.primary}
                />
                <View style={styles.transitHintRow}>
                  <Text style={styles.transitHint}>5 min</Text>
                  <Text style={styles.transitHint}>60 min</Text>
                </View>
              </GlassCard>
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="options" size={20} color={theme.colors.tertiary} />
              <Text style={styles.sectionTitle}>Soft Scoring Preferences</Text>
              <View style={[styles.badge, { backgroundColor: theme.colors.tertiaryContainer }]}>
                <Text style={[styles.badgeText, { color: theme.colors.tertiary }]}>{softConstraints.filter(c => c.enabled).length}</Text>
              </View>
            </View>
            <Text style={styles.sectionHint}>These affect how schedules are scored and ranked</Text>
            {softConstraints.map(renderSoftConstraint)}
          </View>

          {instructorConstraints.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person" size={20} color={theme.colors.secondary} />
                <Text style={styles.sectionTitle}>Instructor Travel Requirements</Text>
                <View style={[styles.badge, { backgroundColor: theme.colors.secondaryContainer }]}>
                  <Text style={[styles.badgeText, { color: theme.colors.secondary }]}>{instructorConstraints.length}</Text>
                </View>
              </View>
              {instructorConstraints.map((item: Constraint) => (
                <GlassCard 
                  key={item.id}
                  variant="elevated" 
                  elevation={2}
                  style={styles.constraintCard}
                >
                  <View style={styles.constraintHeader}>
                    <View style={styles.constraintInfo}>
                      <View style={[
                        styles.constraintIcon,
                        { backgroundColor: theme.colors.secondaryContainer }
                      ]}>
                        <Ionicons 
                          name="person" as any
                          size={18} 
                          color={theme.colors.secondary}
                        />
                      </View>
                      <View style={styles.constraintText}>
                        <Text style={styles.constraintName}>{item.name}</Text>
                        <Text style={styles.constraintDescription}>
                          {(item.params?.transitTimeMinutes as number) || 30} min transit time
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleRemoveInstructorConstraint(item.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ))}
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>

      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={28} color={theme.colors.onPrimary} />
      </TouchableOpacity>

      <Modal visible={isModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Instructor</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSectionLabel}>Select Instructor</Text>
            <View style={styles.chipGrid}>
              {SEED_INSTRUCTORS.map(instructor => {
                const existingConstraint = instructorConstraints.find(c => c.id.includes(instructor.id));
                return (
                  <TouchableOpacity
                    key={instructor.id}
                    style={[
                      styles.chip,
                      selectedInstructor === instructor.id && styles.chipSelected,
                      existingConstraint && styles.chipDisabled
                    ]}
                    onPress={() => !existingConstraint && setSelectedInstructor(instructor.id)}
                    disabled={!!existingConstraint}
                  >
                    <Ionicons 
                      name="person" 
                      size={16} 
                      color={selectedInstructor === instructor.id ? theme.colors.onPrimary : theme.colors.onSurfaceVariant} 
                    />
                    <Text style={[
                      styles.chipText,
                      selectedInstructor === instructor.id && styles.chipTextSelected
                    ]}>
                      {instructor.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalSectionLabel}>Travel Time</Text>
            <View style={styles.transitRow}>
              <Slider
                style={{ flex: 1, height: 40 }}
                minimumValue={5}
                maximumValue={60}
                step={5}
                value={transitTime}
                onValueChange={setTransitTime}
                minimumTrackTintColor={theme.colors.primary}
                maximumTrackTintColor={theme.colors.surfaceContainerHigh}
                thumbTintColor={theme.colors.primary}
              />
              <View style={styles.transitValueBox}>
                <Text style={styles.transitValueText}>{transitTime}</Text>
                <Text style={styles.transitValueUnit}>min</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.addButton,
                !selectedInstructor && styles.addButtonDisabled
              ]} 
              onPress={handleAddInstructorConstraint}
              disabled={!selectedInstructor}
            >
              <Ionicons name="add" size={20} color={theme.colors.onPrimary} />
              <Text style={styles.addButtonText}>Add Instructor Rule</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#f9f9fe',
    zIndex: 10,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.onSurface,
    letterSpacing: -0.5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onSurface,
    flex: 1,
  },
  sectionHint: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: theme.colors.tertiaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.tertiary,
  },
  transitCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  transitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  transitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  transitLabel: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
  },
  transitValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  transitHintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transitHint: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  constraintCard: {
    padding: 16,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  constraintCardDisabled: {
    opacity: 0.6,
  },
  constraintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  constraintInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  constraintIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  constraintText: {
    flex: 1,
  },
  constraintName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
    marginBottom: 2,
  },
  constraintDescription: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  removeButton: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.surfaceContainerLowest,
    padding: 24,
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.onSurface,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 16,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    gap: 6,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
  },
  chipTextSelected: {
    color: theme.colors.onPrimary,
  },
  transitValueBox: {
    alignItems: 'center',
    minWidth: 50,
    marginLeft: 16,
  },
  transitValueText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  transitValueUnit: {
    fontSize: 11,
    color: theme.colors.onSurfaceVariant,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 16,
    marginTop: 32,
    gap: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonDisabled: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    shadowOpacity: 0,
    elevation: 0,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
});
