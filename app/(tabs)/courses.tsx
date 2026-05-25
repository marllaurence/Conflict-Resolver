import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '../../src/components/GlassCard';
import { useStore } from '../../src/store/useStore';
import { runStudentSolver } from '../../src/algorithm/workerBridge';
import { theme, COURSE_COLORS } from '../../src/theme';
import { Course, Section, Timeslot } from '../../src/types';
import { SEED_INSTRUCTORS } from '../../src/utils/seed';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const formatTime = (decimalTime: number): string => {
  const hours = Math.floor(decimalTime);
  const minutes = Math.round((decimalTime - hours) * 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const getCourseColor = (courseId: string): { bg: string; text: string } => {
  const index = Math.abs(courseId.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % COURSE_COLORS.length;
  return COURSE_COLORS[index];
};

const SectionItem = ({ 
  section, 
  index, 
  rooms, 
  buildings 
}: { 
  section: Section; 
  index: number; 
  rooms: any[]; 
  buildings: any[] 
}) => {
  const room = rooms.find((r: any) => r.id === section.roomId);
  const building = room ? buildings.find((b: any) => b.id === room.buildingId) : null;
  
  return (
    <View style={styles.sectionItem}>
      <View style={styles.sectionIndex}>
        <Text style={styles.sectionIndexText}>{index + 1}</Text>
      </View>
      <View style={styles.sectionInfo}>
        <View style={styles.sectionTimeRow}>
          <Ionicons name="time-outline" size={14} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.sectionTime}>
            {DAYS[section.timeslot.day - 1]} {formatTime(section.timeslot.start)} - {formatTime(section.timeslot.end)}
          </Text>
        </View>
        <View style={styles.sectionLocationRow}>
          <Ionicons name="location-outline" size={14} color={theme.colors.onSurfaceVariant} />
          <Text style={styles.sectionLocation}>
            {room?.name || 'TBA'}
            {building && (
              <Text style={styles.buildingBadge}> {building.shortName}</Text>
            )}
          </Text>
        </View>
      </View>
    </View>
  );
};

interface CourseFormData {
  code: string;
  name: string;
  creditHours: string;
  sections: {
    id: string;
    instructorId: string;
    roomId: string;
    timeslot: Timeslot;
  }[];
}

const generateId = () => Math.random().toString(36).substring(2, 11);

export default function CatalogScreen() {
  const { catalog, cart, toggleCartItem, rooms, buildings, addCourse, updateCourse, deleteCourse, preferences } = useStore();
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [showModal, setShowModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    code: '',
    name: '',
    creditHours: '3',
    sections: []
  });

  const resetForm = () => {
    setFormData({ code: '', name: '', creditHours: '3', sections: [] });
    setEditingCourse(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      code: course.code,
      name: course.name,
      creditHours: course.creditHours.toString(),
      sections: course.sections.map(s => ({
        id: s.id,
        instructorId: s.instructorId,
        roomId: s.roomId,
        timeslot: { ...s.timeslot }
      }))
    });
    setShowModal(true);
  };

  const handleDelete = (course: Course) => {
    Alert.alert(
      'Delete Course',
      `Are you sure you want to delete ${course.code}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteCourse(course.id);
          }
        }
      ]
    );
  };

  const handleSave = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      Alert.alert('Error', 'Course code and name are required');
      return;
    }

    const courseId = editingCourse?.id || generateId();
    const courseData: Course = {
      id: courseId,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      creditHours: parseInt(formData.creditHours) || 3,
      sections: formData.sections.map(s => ({
        ...s,
        id: s.id || generateId(),
        courseId: courseId
      }))
    };

    if (editingCourse) {
      updateCourse(editingCourse.id, courseData);
    } else {
      addCourse(courseData);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowModal(false);
    resetForm();
  };

  const handleAddSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, {
        id: generateId(),
        instructorId: '',
        roomId: rooms[0]?.id || '',
        timeslot: { day: 1, start: 9, end: 10 }
      }]
    }));
  };

  const handleRemoveSection = (index: number) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateSection = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      sections: prev.sections.map((s, i) => 
        i === index 
          ? { ...s, [field]: value }
          : s
      )
    }));
  };

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const wasInCart = cart.includes(id);
    toggleCartItem(id);
    if (!wasInCart) {
      const hasTimePreference = preferences.preferMornings || preferences.preferAfternoons;
      if (hasTimePreference) {
        setTimeout(() => runStudentSolver(), 100);
      }
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedCourses);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCourses(newExpanded);
  };

  const renderItem = ({ item, index }: { item: Course, index: number }) => {
    const inCart = cart.includes(item.id);
    const isExpanded = expandedCourses.has(item.id);
    const color = getCourseColor(item.id);
    
    return (
      <Animated.View entering={FadeInDown.delay(index * 50)}>
        <GlassCard 
          variant="elevated" 
          elevation={inCart ? 3 : 1}
          style={[
            styles.courseCard, 
            inCart && { borderWidth: 2, borderColor: theme.colors.primary }
          ]}
        >
          <View style={styles.cardHeader}>
            <View style={styles.cardTitleRow}>
              <View style={[styles.courseColorBar, { backgroundColor: color.bg }]} />
              <View style={styles.cardTitleContent}>
                <Text style={styles.courseCode}>{item.code}</Text>
                <Text style={styles.courseName}>{item.name}</Text>
              </View>
            </View>
            <View style={styles.cardBadges}>
              <View style={styles.creditBadge}>
                <Text style={styles.creditBadgeText}>{item.creditHours} CR</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.expandToggle}
            onPress={() => toggleExpand(item.id)}
          >
            <Text style={styles.expandToggleText}>
              {item.sections.length} Sections {isExpanded ? '▲' : '▼'}
            </Text>
          </TouchableOpacity>

          {isExpanded && (
            <View style={styles.sectionsList}>
              {item.sections.map((section, i) => (
                <SectionItem 
                  key={section.id} 
                  section={section} 
                  index={i} 
                  rooms={rooms} 
                  buildings={buildings} 
                />
              ))}
            </View>
          )}
          
          <View style={styles.cardFooter}>
            <View style={styles.footerActions}>
              <TouchableOpacity 
                style={styles.footerActionBtn}
                onPress={() => handleOpenEdit(item)}
              >
                <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.footerActionBtn}
                onPress={() => handleDelete(item)}
              >
                <Ionicons name="trash-outline" size={16} color={theme.colors.error} />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity 
              style={[
                styles.addButton,
                inCart && styles.addButtonActive
              ]} 
              onPress={() => handleToggle(item.id)}
            >
              <Ionicons 
                name={inCart ? "checkmark" : "add"} 
                size={18} 
                color={inCart ? theme.colors.onPrimary : theme.colors.primary} 
              />
              <Text style={[
                styles.addButtonText,
                inCart && styles.addButtonTextActive
              ]}>
                {inCart ? 'Added' : 'Add'}
              </Text>
            </TouchableOpacity>
          </View>
        </GlassCard>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#f9f9fe', '#e8e8ed']} style={styles.gradient}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Course Catalog</Text>
            <Text style={styles.headerTitle}>Browse Courses</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.addCourseBtn} onPress={handleOpenAdd}>
              <Ionicons name="add" size={22} color={theme.colors.onPrimary} />
            </TouchableOpacity>
            <View style={styles.cartBadge}>
              <Ionicons name="book" size={20} color={theme.colors.onPrimary} />
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          </View>
        </View>

        <FlatList
          data={catalog}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>

      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {editingCourse ? 'Edit Course' : 'Add Course'}
                </Text>
                <TouchableOpacity onPress={() => { setShowModal(false); resetForm(); }}>
                  <Ionicons name="close" size={24} color={theme.colors.onSurface} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Course Code</Text>
              <TextInput
                style={styles.textInput}
                value={formData.code}
                onChangeText={(text) => setFormData(prev => ({ ...prev, code: text }))}
                placeholder="e.g. CS101"
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />

              <Text style={styles.inputLabel}>Course Name</Text>
              <TextInput
                style={styles.textInput}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="e.g. Introduction to Computer Science"
                placeholderTextColor={theme.colors.onSurfaceVariant}
              />

              <Text style={styles.inputLabel}>Credit Hours</Text>
              <TextInput
                style={styles.textInput}
                value={formData.creditHours}
                onChangeText={(text) => setFormData(prev => ({ ...prev, creditHours: text }))}
                placeholder="3"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                keyboardType="number-pad"
              />

              <View style={styles.sectionsHeader}>
                <Text style={styles.inputLabel}>Sections</Text>
                <TouchableOpacity style={styles.addSectionBtn} onPress={handleAddSection}>
                  <Ionicons name="add-circle" size={20} color={theme.colors.primary} />
                  <Text style={styles.addSectionBtnText}>Add Section</Text>
                </TouchableOpacity>
              </View>

              {formData.sections.map((section, index) => (
                <View key={section.id} style={styles.sectionForm}>
                  <View style={styles.sectionFormHeader}>
                    <Text style={styles.sectionFormTitle}>Section {index + 1}</Text>
                    <TouchableOpacity onPress={() => handleRemoveSection(index)}>
                      <Ionicons name="remove-circle" size={20} color={theme.colors.error} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.smallLabel}>Instructor</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomScroll}>
                    {SEED_INSTRUCTORS.map(inst => (
                      <TouchableOpacity
                        key={inst.id}
                        style={[
                          styles.roomChip,
                          section.instructorId === inst.id && styles.roomChipSelected
                        ]}
                        onPress={() => handleUpdateSection(index, 'instructorId', inst.id)}
                      >
                        <Text style={[
                          styles.roomChipText,
                          section.instructorId === inst.id && styles.roomChipTextSelected
                        ]}>
                          {inst.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <Text style={styles.smallLabel}>Room</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.roomScroll}>
                    {rooms.map(room => (
                      <TouchableOpacity
                        key={room.id}
                        style={[
                          styles.roomChip,
                          section.roomId === room.id && styles.roomChipSelected
                        ]}
                        onPress={() => handleUpdateSection(index, 'roomId', room.id)}
                      >
                        <Text style={[
                          styles.roomChipText,
                          section.roomId === room.id && styles.roomChipTextSelected
                        ]}>
                          {room.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.timeslotRow}>
                    <View style={styles.timeslotField}>
                      <Text style={styles.smallLabel}>Day</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {DAYS.map((day, dIndex) => (
                          <TouchableOpacity
                            key={day}
                            style={[
                              styles.dayChip,
                              section.timeslot.day === dIndex + 1 && styles.dayChipSelected
                            ]}
                            onPress={() => handleUpdateSection(index, 'timeslot', { 
                              ...section.timeslot, 
                              day: dIndex + 1 
                            })}
                          >
                            <Text style={[
                              styles.dayChipText,
                              section.timeslot.day === dIndex + 1 && styles.dayChipTextSelected
                            ]}>
                              {day}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.timeslotRow}>
                    <View style={styles.timeslotField}>
                      <Text style={styles.smallLabel}>Start Time</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(hour => (
                          <TouchableOpacity
                            key={`start-${hour}`}
                            style={[
                              styles.timeChip,
                              section.timeslot.start === hour && styles.timeChipSelected
                            ]}
                            onPress={() => handleUpdateSection(index, 'timeslot', { 
                              ...section.timeslot, 
                              start: hour 
                            })}
                          >
                            <Text style={[
                              styles.timeChipText,
                              section.timeslot.start === hour && styles.timeChipTextSelected
                            ]}>
                              {formatTime(hour)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  <View style={styles.timeslotRow}>
                    <View style={styles.timeslotField}>
                      <Text style={styles.smallLabel}>End Time</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18].map(hour => (
                          <TouchableOpacity
                            key={`end-${hour}`}
                            style={[
                              styles.timeChip,
                              section.timeslot.end === hour && styles.timeChipSelected
                            ]}
                            onPress={() => handleUpdateSection(index, 'timeslot', { 
                              ...section.timeslot, 
                              end: hour 
                            })}
                          >
                            <Text style={[
                              styles.timeChipText,
                              section.timeslot.end === hour && styles.timeChipTextSelected
                            ]}>
                              {formatTime(hour)}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              ))}

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>
                  {editingCourse ? 'Update Course' : 'Add Course'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#f9f9fe',
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
  cartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cartBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
  listContent: { 
    padding: 20, 
    paddingBottom: 120 
  },
  courseCard: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerLowest,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  courseColorBar: {
    width: 4,
    height: 40,
    borderRadius: 2,
  },
  cardTitleContent: {},
  courseCode: { 
    fontSize: 18, 
    fontWeight: '800', 
    color: theme.colors.onSurface,
    letterSpacing: -0.3,
  },
  courseName: { 
    fontSize: 13, 
    color: theme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  cardBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  creditBadge: {
    backgroundColor: theme.colors.secondaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  creditBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.secondary,
  },
  expandToggle: {
    marginBottom: 12,
  },
  expandToggleText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  sectionsList: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  sectionIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionIndexText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurfaceVariant,
  },
  sectionInfo: {
    flex: 1,
  },
  sectionTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sectionTime: {
    fontSize: 13,
    color: theme.colors.onSurface,
    fontWeight: '500',
  },
  sectionLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLocation: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  buildingBadge: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  addButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  addButtonTextActive: {
    color: theme.colors.onPrimary,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  addCourseBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  footerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.onSurface,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  smallLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
    marginBottom: 6,
    marginTop: 12,
  },
  textInput: {
    backgroundColor: theme.colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: theme.colors.onSurface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  sectionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  addSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addSectionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  sectionForm: {
    backgroundColor: theme.colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  sectionFormHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionFormTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  roomScroll: {
    flexGrow: 0,
  },
  roomChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceContainerHighest,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  roomChipSelected: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.primary,
  },
  roomChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
  },
  roomChipTextSelected: {
    color: theme.colors.primary,
  },
  timeslotRow: {
    marginTop: 8,
  },
  timeslotField: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceContainerHighest,
    marginRight: 6,
  },
  dayChipSelected: {
    backgroundColor: theme.colors.primary,
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.onSurfaceVariant,
  },
  dayChipTextSelected: {
    color: theme.colors.onPrimary,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: theme.colors.surfaceContainerHighest,
    marginRight: 6,
  },
  timeChipSelected: {
    backgroundColor: theme.colors.secondary,
  },
  timeChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: theme.colors.onSurfaceVariant,
  },
  timeChipTextSelected: {
    color: theme.colors.onSecondary,
  },
  saveBtn: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onPrimary,
  },
});
