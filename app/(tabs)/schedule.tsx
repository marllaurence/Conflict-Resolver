import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GlassCard } from '../../src/components/GlassCard';
import { useStore } from '../../src/store/useStore';
import { theme, COURSE_COLORS } from '../../src/theme';
import { Section } from '../../src/types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOUR_HEIGHT = 80;
const START_HOUR = 8;

const formatTime = (decimalTime: number): string => {
  const hours = Math.floor(decimalTime);
  const minutes = Math.round((decimalTime - hours) * 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const formatHour = (hour: number): string => {
  const displayHour = hour > 12 ? hour - 12 : hour;
  return `${displayHour}:00`;
};

const getCourseColor = (courseId: string): { bg: string; text: string } => {
  const index = Math.abs(hashCode(courseId)) % COURSE_COLORS.length;
  return COURSE_COLORS[index];
};

const hashCode = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
};

const getBuildingShortName = (roomId: string, rooms: any[], buildings: any[]): string => {
  const room = rooms.find((r: any) => r.id === roomId);
  if (!room) return '?';
  const building = buildings.find((b: any) => b.id === room.buildingId);
  return building?.shortName || '?';
};

interface TimeBlock {
  hour: number;
  label: string;
}

const generateTimeBlocks = (): TimeBlock[] => {
  const blocks: TimeBlock[] = [];
  for (let h = START_HOUR; h <= 18; h++) {
    blocks.push({ hour: h, label: formatHour(h) });
  }
  return blocks;
};

interface ClassCardProps {
  section: Section;
  courseName: string;
  courseCode: string;
  roomName: string;
  building: string;
  color: { bg: string; text: string };
  hasConflict: boolean;
  conflictMessage?: string;
  onPress: () => void;
}

const ClassCard = ({ 
  section, 
  courseName, 
  courseCode, 
  roomName, 
  building, 
  color, 
  hasConflict, 
  conflictMessage,
  onPress 
}: ClassCardProps) => (
  <Pressable 
    onPress={onPress}
    style={({ pressed }) => [
      styles.classCard,
      { backgroundColor: color.bg },
      hasConflict && styles.classCardConflict,
      pressed && styles.classCardPressed
    ]}
  >
    <View style={styles.classCardContent}>
      <View style={styles.classCardMain}>
        <Text style={[styles.classCardTitle, { color: color.text }]}>{courseCode}</Text>
        <Text style={[styles.classCardSubtitle, { color: color.text, opacity: 0.9 }]}>{courseName}</Text>
        <Text style={[styles.classCardRoom, { color: color.text, opacity: 0.8 }]}>
          {roomName} • {building}
        </Text>
      </View>
      <View style={styles.classCardRight}>
        <Text style={[styles.classCardTime, { color: color.text }]}>
          {formatTime(section.timeslot.start)}
        </Text>
        <Text style={[styles.classCardDuration, { color: color.text, opacity: 0.7 }]}>
          {formatTime(section.timeslot.end)}
        </Text>
        {hasConflict && (
          <View style={styles.conflictBadge}>
            <Ionicons name="warning" size={14} color="#fff" />
          </View>
        )}
      </View>
    </View>
  </Pressable>
);

export default function ScheduleScreen() {
  const router = useRouter();
  const { generatedSchedules, catalog, rooms, buildings, selectedScheduleIndex } = useStore();
  const [selectedDay, setSelectedDay] = useState<number>(2);
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [showModal, setShowModal] = useState(false);

  if (generatedSchedules.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Schedule Yet</Text>
          <Text style={styles.emptySubtitle}>
            Generate your schedule from the dashboard to see your weekly timetable
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => router.push('/(tabs)')}
          >
            <Text style={styles.emptyButtonText}>Go to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const activeSchedule = generatedSchedules[selectedScheduleIndex];
  const timeBlocks = generateTimeBlocks();
  
  const getSectionsForDay = (day: number) => {
    return activeSchedule.sections.filter(s => s.timeslot.day === day);
  };

  const handleSectionPress = (section: Section) => {
    setSelectedSection(section);
    setShowModal(true);
  };

  const activeConflicts = activeSchedule.conflicts;

  const getClassForSlot = (hour: number) => {
    const sections = getSectionsForDay(selectedDay);
    return sections.find(s => {
      const startHour = Math.floor(s.timeslot.start);
      const endHour = Math.ceil(s.timeslot.end);
      return hour >= startHour && hour < endHour;
    });
  };

  const isClassStart = (section: Section, hour: number) => {
    return Math.floor(section.timeslot.start) === hour;
  };

  const getClassSpan = (section: Section) => {
    const start = section.timeslot.start;
    const end = section.timeslot.end;
    return end - start;
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f9f9fe', '#e8e8ed']} style={styles.gradient}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          stickyHeaderIndices={[0, 2]}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.stickyContainer}>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View>
                  <Text style={styles.headerSubtitle}>Top {generatedSchedules.length} Options</Text>
                  <Text style={styles.headerTitle}>My Schedule</Text>
                </View>
                <TouchableOpacity 
                  style={styles.addButton}
                  onPress={() => router.push('/(tabs)/courses')}
                >
                  <Ionicons name="add" size={24} color={theme.colors.onPrimary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scheduleSelectorContent}
              style={styles.scheduleSelectorScroll}
            >
              {generatedSchedules.map((sch, index) => (
                <TouchableOpacity
                  key={sch.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    useStore.getState().setSelectedScheduleIndex(index);
                  }}
                  style={[
                    styles.schedulePill,
                    selectedScheduleIndex === index && styles.schedulePillActive
                  ]}
                >
                  <Text style={[
                    styles.schedulePillText,
                    selectedScheduleIndex === index && styles.schedulePillTextActive
                  ]}>
                    Option {index + 1}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daySelectorContent}
              style={styles.daySelectorScroll}
            >
              {DAYS.map((day, index) => {
                const dayNum = index + 1;
                const hasClasses = getSectionsForDay(dayNum).length > 0;
                const isSelected = selectedDay === dayNum;
                
                return (
                  <TouchableOpacity
                    key={day}
                    onPress={() => setSelectedDay(dayNum)}
                    style={[
                      styles.dayPill,
                      isSelected && styles.dayPillActive,
                      hasClasses && !isSelected && styles.dayPillHasClass
                    ]}
                  >
                    <Text style={[
                      styles.dayPillText,
                      isSelected && styles.dayPillTextActive
                    ]}>
                      {day}
                    </Text>
                    <Text style={[
                      styles.dayPillDate,
                      isSelected && styles.dayPillDateActive
                    ]}>
                      {23 + index}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.dailyViewSticky}>
            <Text style={styles.sectionTitle}>Daily View</Text>
          </View>

          <View style={styles.timelineContainer}>
            
            <View style={styles.timeline}>
              {timeBlocks.map((block) => {
                const section = getClassForSlot(block.hour);
                const isStart = section && isClassStart(section, block.hour);
                
                return (
                  <View key={block.hour} style={styles.timeRow}>
                    <View style={styles.timeLabel}>
                      <Text style={styles.timeLabelText}>{block.label}</Text>
                    </View>
                    <View style={styles.timeContent}>
                      <View style={styles.timeDivider} />
                      {isStart && section && (
                        <View style={[styles.classWrapper, { height: getClassSpan(section) * HOUR_HEIGHT - 8 }]}>
                          {(() => {
                            const course = catalog.find(c => c.id === section.courseId);
                            const room = rooms.find((r: any) => r.id === section.roomId);
                            const building = getBuildingShortName(section.roomId, rooms, buildings);
                            const color = getCourseColor(section.courseId);
                            const hasConflict = activeConflicts.some(c => c.sectionIds.includes(section.id));
                            
                            return (
                              <ClassCard
                                section={section}
                                courseName={course?.name || 'Unknown Course'}
                                courseCode={course?.code || '???'}
                                roomName={room?.name.split(' ').slice(-1)[0] || 'TBA'}
                                building={building}
                                color={color}
                                hasConflict={hasConflict}
                                onPress={() => handleSectionPress(section)}
                              />
                            );
                          })()}
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {activeConflicts.length > 0 && (
            <View style={styles.conflictSection}>
              <View style={styles.conflictHeader}>
                <Ionicons name="warning" size={20} color={theme.colors.error} />
                <Text style={styles.conflictTitle}>Conflict Report</Text>
                <View style={styles.conflictBadgeLarge}>
                  <Text style={styles.conflictBadgeLargeText}>{activeConflicts.length}</Text>
                </View>
              </View>
              
              <GlassCard variant="filled" style={styles.conflictCard}>
                {activeConflicts.map((conflict, index) => (
                  <React.Fragment key={conflict.id}>
                    {index > 0 && <View style={styles.conflictDivider} />}
                    <View style={styles.conflictItem}>
                      <View style={[
                        styles.conflictIconContainer,
                        { backgroundColor: conflict.type === 'BUILDING_TRAVEL' ? theme.colors.tertiaryContainer : theme.colors.errorContainer }
                      ]}>
                        <Ionicons 
                          name={(conflict.type === 'BUILDING_TRAVEL' ? 'directions-walk' : 'event-busy') as any} 
                          size={20} 
                          color={conflict.type === 'BUILDING_TRAVEL' ? theme.colors.tertiary : theme.colors.error} 
                        />
                      </View>
                      <View style={styles.conflictContent}>
                        <View style={styles.conflictItemHeader}>
                          <Text style={styles.conflictItemTitle}>
                            {conflict.type === 'TIME_OVERLAP' && 'Time Overlap Detected'}
                            {conflict.type === 'BUILDING_TRAVEL' && 'Travel Warning'}
                            {conflict.type === 'CONSTRAINT_VIOLATION' && 'Constraint Violation'}
                            {conflict.type === 'INSTRUCTOR_UNAVAILABLE' && 'Instructor Unavailable'}
                            {conflict.type === 'INSTRUCTOR_CONFLICT' && 'Instructor Conflict'}
                            {conflict.type === 'ROOM_CONFLICT' && 'Room Conflict'}
                            {conflict.type === 'ROOM_CAPACITY' && 'Room Capacity Exceeded'}
                            {conflict.type === 'PREREQUISITE_ORDERING' && 'Prerequisite Not Met'}
                            {conflict.type === 'SECTION_UNIQUENESS' && 'Section Uniqueness Violation'}
                          </Text>
                          <View style={[
                            styles.conflictSeverityBadge,
                            { backgroundColor: conflict.severity === 'hard' ? theme.colors.errorContainer : theme.colors.tertiaryContainer }
                          ]}>
                            <Text style={[
                              styles.conflictSeverityText,
                              { color: conflict.severity === 'hard' ? theme.colors.error : theme.colors.tertiary }
                            ]}>
                              {conflict.severity === 'hard' ? 'Critical' : 'Warning'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.conflictMessage}>{conflict.message}</Text>
                        {conflict.suggestion && (
                          <View style={styles.conflictActions}>
                            <TouchableOpacity style={styles.conflictActionBtn}>
                              <Text style={styles.conflictActionBtnText}>Reschedule</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.conflictActionBtn, styles.conflictActionBtnSecondary]}>
                              <Text style={styles.conflictActionBtnTextSecondary}>Dismiss</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    </View>
                  </React.Fragment>
                ))}
              </GlassCard>
            </View>
          )}

          <View style={{ height: 100 }} />
        </ScrollView>
      </LinearGradient>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedSection && (() => {
              const course = catalog.find(c => c.id === selectedSection.courseId);
              const room = rooms.find((r: any) => r.id === selectedSection.roomId);
              const color = getCourseColor(selectedSection.courseId);
              const sectionConflicts = activeConflicts.filter(c => c.sectionIds.includes(selectedSection.id));
              
              return (
                <>
                  <View style={styles.modalHeader}>
                    <View style={[styles.modalColorBar, { backgroundColor: color.bg }]} />
                    <View style={styles.modalHeaderContent}>
                      <Text style={styles.modalTitle}>{course?.code}</Text>
                      <TouchableOpacity onPress={() => setShowModal(false)}>
                        <Ionicons name="close" size={24} color={theme.colors.onSurface} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <Text style={styles.modalCourseName}>{course?.name}</Text>
                  
                  <View style={styles.modalDetail}>
                    <Ionicons name="time" size={20} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.modalDetailText}>
                      {DAYS[selectedSection.timeslot.day - 1]} {formatTime(selectedSection.timeslot.start)} - {formatTime(selectedSection.timeslot.end)}
                    </Text>
                  </View>
                  
                  <View style={styles.modalDetail}>
                    <Ionicons name="location" size={20} color={theme.colors.onSurfaceVariant} />
                    <Text style={styles.modalDetailText}>{room?.name}</Text>
                  </View>
                  
                  {sectionConflicts.length > 0 && (
                    <View style={styles.modalConflicts}>
                      <Text style={styles.modalConflictsTitle}>Conflicts</Text>
                      {sectionConflicts.map((conflict) => (
                        <View key={conflict.id} style={styles.modalConflictItem}>
                          <Ionicons name="warning" size={16} color={theme.colors.error} />
                          <Text style={styles.modalConflictText}>{conflict.message}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  
                  <TouchableOpacity 
                    style={styles.modalCloseBtn}
                    onPress={() => setShowModal(false)}
                  >
                    <Text style={styles.modalCloseBtnText}>Close</Text>
                  </TouchableOpacity>
                </>
              );
            })()}
          </View>
        </View>
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
    minHeight: '100%',
  },
  stickyContainer: {
    backgroundColor: '#f9f9fe',
    zIndex: 100,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#f9f9fe',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scheduleSelectorScroll: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  scheduleSelectorContent: {
    gap: 8,
    paddingRight: 20,
  },
  schedulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: theme.colors.surfaceContainerLow,
    gap: 8,
  },
  schedulePillActive: {
    backgroundColor: theme.colors.primaryContainer,
  },
  schedulePillText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  schedulePillTextActive: {
    color: theme.colors.primary,
  },
  schedulePillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  schedulePillBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
  },
  daySelectorScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  daySelectorContent: {
    gap: 8,
    paddingRight: 20,
  },
  dayPill: {
    width: 56,
    height: 72,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerLowest,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  dayPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dayPillHasClass: {
    borderColor: theme.colors.primary,
    borderWidth: 2,
  },
  dayPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dayPillTextActive: {
    color: theme.colors.onPrimary,
    opacity: 0.9,
  },
  dayPillDate: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.onSurface,
    marginTop: 4,
  },
  dayPillDateActive: {
    color: theme.colors.onPrimary,
  },
  timelineContainer: {
    paddingHorizontal: 20,
  },
  dailyViewSticky: {
    backgroundColor: '#f9f9fe',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  timeline: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  timeRow: {
    flexDirection: 'row',
    minHeight: HOUR_HEIGHT,
  },
  timeLabel: {
    width: 60,
    paddingRight: 12,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  timeLabelText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
  },
  timeContent: {
    flex: 1,
    position: 'relative',
    paddingVertical: 8,
  },
  timeDivider: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
  },
  classWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  classCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  classCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  classCardConflict: {
    borderWidth: 2,
    borderColor: theme.colors.error,
  },
  classCardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  classCardMain: {
    flex: 1,
  },
  classCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  classCardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  classCardRoom: {
    fontSize: 10,
    marginTop: 4,
  },
  classCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  classCardTime: {
    fontSize: 11,
    fontWeight: '600',
  },
  classCardDuration: {
    fontSize: 10,
  },
  conflictBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: theme.colors.error,
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  conflictSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  conflictHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  conflictTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onSurface,
    flex: 1,
  },
  conflictBadgeLarge: {
    backgroundColor: theme.colors.error,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conflictBadgeLargeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  conflictCard: {
    padding: 0,
    overflow: 'hidden',
  },
  conflictDivider: {
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
    marginHorizontal: 16,
  },
  conflictItem: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  conflictIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  conflictContent: {
    flex: 1,
  },
  conflictItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  conflictItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
    flex: 1,
  },
  conflictSeverityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  conflictSeverityText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  conflictMessage: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    lineHeight: 18,
  },
  conflictActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  conflictActionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  conflictActionBtnSecondary: {
    backgroundColor: 'transparent',
  },
  conflictActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  conflictActionBtnTextSecondary: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: theme.colors.background,
  },
  emptyContent: {
    alignItems: 'center',
    maxWidth: 280,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: theme.colors.primaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.onSurface,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: theme.colors.surfaceContainerLowest,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalColorBar: {
    height: 4,
    width: 32,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.onSurface,
  },
  modalCourseName: {
    fontSize: 14,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 20,
  },
  modalDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  modalDetailText: {
    fontSize: 15,
    color: theme.colors.onSurface,
  },
  modalConflicts: {
    marginTop: 16,
    padding: 16,
    backgroundColor: theme.colors.errorContainer,
    borderRadius: 12,
  },
  modalConflictsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.error,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  modalConflictItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  modalConflictText: {
    fontSize: 13,
    color: theme.colors.onErrorContainer,
    flex: 1,
    lineHeight: 18,
  },
  modalCloseBtn: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 24,
  },
  modalCloseBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onSurface,
  },
});
