import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, Layout, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { theme } from '../theme';
import { Section, Course, Room, Instructor, Building } from '../types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const START_HOUR = 8;
const END_HOUR = 18;
const HOUR_HEIGHT = 60;
const DAY_WIDTH = 70;
const TIME_COLUMN_WIDTH = 50;

interface Props {
  sections: Section[];
  courses: Course[];
  rooms: Room[];
  instructors: Instructor[];
  buildings: Building[];
  isConflict?: (sectionId: string) => boolean;
}

const screenToCanvas = {
  timeToY: (time: number): number => {
    return (time - START_HOUR) * HOUR_HEIGHT;
  },
  
  yToTime: (y: number): number => {
    return (y / HOUR_HEIGHT) + START_HOUR;
  },
  
  dayToX: (day: number): number => {
    return TIME_COLUMN_WIDTH + (day - 1) * DAY_WIDTH;
  },
  
  xToDay: (x: number): number => {
    return Math.floor((x - TIME_COLUMN_WIDTH) / DAY_WIDTH) + 1;
  },
  
  getTimeFromY: (y: number): { hour: number; minute: number } => {
    const time = screenToCanvas.yToTime(y);
    const hour = Math.floor(time);
    const minute = Math.round((time - hour) * 60);
    return { hour, minute };
  },
  
  formatTime: (time: number): string => {
    const hours = Math.floor(time);
    const minutes = Math.round((time - hours) * 60);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHour = hours > 12 ? hours - 12 : hours;
    return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  }
};

const CourseBlock: React.FC<{
  section: Section;
  course: Course | undefined;
  isConflict: boolean;
}> = ({ section, course, isConflict }) => {
  const topPosition = screenToCanvas.timeToY(section.timeslot.start);
  const height = (section.timeslot.end - section.timeslot.start) * HOUR_HEIGHT;
  const leftPosition = screenToCanvas.dayToX(section.timeslot.day) + 3;
  const width = DAY_WIDTH - 6;
  
  const pulse = useSharedValue(1);
  if (isConflict) {
    pulse.value = withRepeat(withTiming(1.05, { duration: 800 }), -1, true);
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    borderColor: isConflict ? theme.colors.error : 'transparent',
    borderWidth: isConflict ? 2 : 0,
  }));

  return (
    <Animated.View 
      entering={FadeInDown}
      layout={Layout.springify()} 
      style={[
        styles.block, 
        { 
          top: topPosition, 
          height: Math.max(height, 30),
          left: leftPosition,
          width: width,
        },
        animatedStyle
      ]}
    >
      <Text style={styles.courseCode} numberOfLines={1}>{course?.code || section.courseId}</Text>
      <Text style={styles.time} numberOfLines={1}>
        {screenToCanvas.formatTime(section.timeslot.start)}-{screenToCanvas.formatTime(section.timeslot.end)}
      </Text>
    </Animated.View>
  );
};

const TimeLabels: React.FC = () => {
  const hours = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    hours.push(
      <View key={h} style={[styles.timeLabel, { top: screenToCanvas.timeToY(h) }]}>
        <Text style={styles.timeLabelText}>{screenToCanvas.formatTime(h)}</Text>
      </View>
    );
  }
  return <>{hours}</>;
};

const DayHeaders: React.FC = () => (
  <View style={styles.dayHeaderRow}>
    {DAYS.map((day, index) => (
      <View key={day} style={[styles.dayHeader, { left: screenToCanvas.dayToX(index + 1) }]}>
        <Text style={styles.dayHeaderText}>{day}</Text>
      </View>
    ))}
  </View>
);

const GridLines: React.FC = () => {
  const lines = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) {
    lines.push(
      <View key={`h-${h}`} style={[styles.gridLineHorizontal, { top: screenToCanvas.timeToY(h) }]} />
    );
  }
  for (let d = 1; d <= 5; d++) {
    lines.push(
      <View key={`d-${d}`} style={[styles.gridLineVertical, { left: screenToCanvas.dayToX(d) }]} />
    );
  }
  return <>{lines}</>;
};

export const ScheduleGrid: React.FC<Props> = ({ 
  sections, 
  courses, 
  rooms, 
  instructors, 
  buildings,
  isConflict = () => false 
}) => {
  const gridHeight = screenToCanvas.timeToY(END_HOUR) + HOUR_HEIGHT;
  const gridWidth = TIME_COLUMN_WIDTH + (DAY_WIDTH * 5);

  return (
    <View style={[styles.container, { height: gridHeight, width: gridWidth }]}>
      <GridLines />
      <TimeLabels />
      <DayHeaders />
      
      {sections.map((section) => (
        <CourseBlock
          key={section.id}
          section={section}
          course={courses.find(c => c.id === section.courseId)}
          isConflict={isConflict(section.id)}
        />
      ))}
    </View>
  );
};

export const useScheduleGrid = () => screenToCanvas;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: theme.colors.surface,
  },
  block: {
    position: 'absolute',
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: theme.radius.sm,
    padding: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  courseCode: {
    color: theme.colors.onPrimaryContainer,
    fontSize: 11,
    fontWeight: '700',
  },
  time: {
    color: theme.colors.onPrimaryContainer,
    fontSize: 9,
    opacity: 0.8,
  },
  timeLabel: {
    position: 'absolute',
    left: 8,
    width: TIME_COLUMN_WIDTH - 16,
  },
  timeLabelText: {
    fontSize: 10,
    color: theme.colors.onSurfaceVariant,
  },
  dayHeader: {
    position: 'absolute',
    top: 0,
    width: DAY_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
  },
  dayHeaderText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.onSurface,
  },
  gridLineHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: theme.colors.outlineVariant,
  },
  gridLineVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: theme.colors.outlineVariant,
  },
  dayHeaderRow: {
    position: 'absolute',
    top: 0,
    left: TIME_COLUMN_WIDTH,
    right: 0,
    height: 32,
  },
});

export default ScheduleGrid;
