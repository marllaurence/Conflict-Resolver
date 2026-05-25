import { Building, Constraint, Course, Instructor, Room, StudentPreferences } from '../types';

export const SEED_BUILDINGS: Building[] = [
  { id: 'b1', name: 'Turing Hall', shortName: 'TH', adjacentBuildings: ['b2'] },
  { id: 'b2', name: 'Lovelace Lab', shortName: 'LL', adjacentBuildings: ['b1', 'b3'] },
  { id: 'b3', name: 'Hopper Center', shortName: 'HC', adjacentBuildings: ['b2'] },
];

export const SEED_ROOMS: Room[] = [
  { id: 'r1', name: 'Turing Hall 101', capacity: 150, buildingId: 'b1' },
  { id: 'r2', name: 'Lovelace Lab 201', capacity: 40, buildingId: 'b2' },
  { id: 'r3', name: 'Hopper Center 101', capacity: 100, buildingId: 'b3' },
  { id: 'r4', name: 'Turing Hall 203', capacity: 80, buildingId: 'b1' },
  { id: 'r5', name: 'Lovelace Lab 105', capacity: 30, buildingId: 'b2' },
];

export const SEED_INSTRUCTORS: Instructor[] = [
  { 
    id: 'i1', 
    name: 'Dr. Alan Turing', 
    availability: [
      { day: 1, start: 8, end: 17 },
      { day: 2, start: 8, end: 17 },
      { day: 3, start: 8, end: 17 },
      { day: 4, start: 8, end: 17 },
      { day: 5, start: 8, end: 12 },
    ],
    constraints: []
  },
  { 
    id: 'i2', 
    name: 'Dr. Ada Lovelace', 
    availability: [
      { day: 1, start: 10, end: 18 },
      { day: 2, start: 10, end: 18 },
      { day: 3, start: 10, end: 18 },
      { day: 4, start: 10, end: 18 },
    ],
    constraints: []
  },
  { 
    id: 'i3', 
    name: 'Prof. Grace Hopper', 
    availability: [
      { day: 1, start: 8, end: 12 },
      { day: 2, start: 8, end: 12 },
      { day: 3, start: 8, end: 12 },
      { day: 4, start: 8, end: 12 },
      { day: 5, start: 8, end: 12 },
    ],
    constraints: ['NO_BACK_TO_BACK_DIFFERENT_BUILDING']
  },
];

export const SEED_COURSES: Course[] = [
  {
    id: 'c1',
    name: 'Intro to Algorithms',
    code: 'CS101',
    creditHours: 3,
    semester: 1,
    sections: [
      { id: 's1', courseId: 'c1', instructorId: 'i1', roomId: 'r1', timeslot: { day: 1, start: 9, end: 10.5 } },
      { id: 's1b', courseId: 'c1', instructorId: 'i2', roomId: 'r2', timeslot: { day: 2, start: 9, end: 10.5 } },
      { id: 's1c', courseId: 'c1', instructorId: 'i3', roomId: 'r3', timeslot: { day: 3, start: 9, end: 10.5 } },
      { id: 's2', courseId: 'c1', instructorId: 'i2', roomId: 'r2', timeslot: { day: 4, start: 14, end: 15.5 } },
    ]
  },
  {
    id: 'c2',
    name: 'Data Structures',
    code: 'CS201',
    creditHours: 3,
    semester: 2,
    prerequisites: ['c1'],
    sections: [
      { id: 's3', courseId: 'c2', instructorId: 'i1', roomId: 'r4', timeslot: { day: 1, start: 11, end: 12.5 } },
      { id: 's3b', courseId: 'c2', instructorId: 'i2', roomId: 'r5', timeslot: { day: 2, start: 11, end: 12.5 } },
      { id: 's3c', courseId: 'c2', instructorId: 'i3', roomId: 'r3', timeslot: { day: 4, start: 11, end: 12.5 } },
      { id: 's4', courseId: 'c2', instructorId: 'i3', roomId: 'r3', timeslot: { day: 3, start: 10, end: 11.5 } },
    ]
  },
  {
    id: 'c3',
    name: 'Database Systems',
    code: 'CS301',
    creditHours: 4,
    semester: 3,
    prerequisites: ['c2'],
    sections: [
      { id: 's5', courseId: 'c3', instructorId: 'i2', roomId: 'r5', timeslot: { day: 1, start: 14, end: 15.5 } },
      { id: 's5b', courseId: 'c3', instructorId: 'i1', roomId: 'r1', timeslot: { day: 2, start: 14, end: 15.5 } },
      { id: 's6', courseId: 'c3', instructorId: 'i3', roomId: 'r1', timeslot: { day: 3, start: 13, end: 14.5 } },
      { id: 's7', courseId: 'c3', instructorId: 'i1', roomId: 'r3', timeslot: { day: 4, start: 9, end: 10.5 } },
    ]
  },
  {
    id: 'c4',
    name: 'Software Engineering',
    code: 'CS401',
    creditHours: 3,
    semester: 4,
    prerequisites: ['c2', 'c3'],
    sections: [
      { id: 's8', courseId: 'c4', instructorId: 'i2', roomId: 'r2', timeslot: { day: 1, start: 15, end: 16.5 } },
      { id: 's8b', courseId: 'c4', instructorId: 'i1', roomId: 'r1', timeslot: { day: 2, start: 15, end: 16.5 } },
      { id: 's8c', courseId: 'c4', instructorId: 'i3', roomId: 'r4', timeslot: { day: 3, start: 15, end: 16.5 } },
      { id: 's9', courseId: 'c4', instructorId: 'i3', roomId: 'r4', timeslot: { day: 4, start: 14, end: 15.5 } },
    ]
  },
  {
    id: 'c5',
    name: 'Computer Networks',
    code: 'CS302',
    creditHours: 3,
    semester: 3,
    prerequisites: ['c2'],
    sections: [
      { id: 's10', courseId: 'c5', instructorId: 'i1', roomId: 'r1', timeslot: { day: 1, start: 13, end: 14.5 } },
      { id: 's10b', courseId: 'c5', instructorId: 'i3', roomId: 'r3', timeslot: { day: 2, start: 13, end: 14.5 } },
      { id: 's10c', courseId: 'c5', instructorId: 'i2', roomId: 'r5', timeslot: { day: 3, start: 13, end: 14.5 } },
      { id: 's11', courseId: 'c5', instructorId: 'i2', roomId: 'r5', timeslot: { day: 4, start: 15, end: 16.5 } },
    ]
  },
];

export const DEFAULT_CONSTRAINTS: Constraint[] = [
  {
    id: 'no_time_overlap',
    name: 'No Time Overlaps',
    description: 'Sections cannot be scheduled at the same time',
    type: 'TIME_OVERLAP',
    severity: 'hard',
    enabled: true,
  },
  {
    id: 'no_instructor_conflict',
    name: 'No Instructor Conflict',
    description: 'Same instructor cannot teach multiple courses at the same time',
    type: 'INSTRUCTOR_CONFLICT',
    severity: 'hard',
    enabled: true,
  },
  {
    id: 'no_room_conflict',
    name: 'No Room Conflict',
    description: 'Same room cannot be assigned to multiple courses at the same time',
    type: 'ROOM_CONFLICT',
    severity: 'hard',
    enabled: true,
  },
  {
    id: 'instructor_availability',
    name: 'Instructor Availability',
    description: 'Classes must be scheduled when instructor is available',
    type: 'INSTRUCTOR_UNAVAILABLE',
    severity: 'hard',
    enabled: true,
  },
  {
    id: 'no_back_to_back_diff_building',
    name: 'No Back-to-Back in Different Buildings',
    description: 'Cannot have classes in different buildings with less than 30 min gap',
    type: 'NO_BACK_TO_BACK_DIFFERENT_BUILDING',
    severity: 'hard',
    enabled: true,
    params: { transitTimeMinutes: 30 },
  },
  {
    id: 'room_capacity',
    name: 'Room Capacity',
    description: 'Room capacity must meet enrollment requirements',
    type: 'ROOM_CAPACITY',
    severity: 'hard',
    enabled: true,
  },
  {
    id: 'prerequisite_ordering',
    name: 'Prerequisite Ordering',
    description: 'Prerequisites must be completed in earlier semester',
    type: 'PREREQUISITE_ORDERING',
    severity: 'hard',
    enabled: true,
  },
  {
    id: 'section_uniqueness',
    name: 'Section Uniqueness',
    description: 'Each section can only have one room/timeslot assignment',
    type: 'SECTION_UNIQUENESS',
    severity: 'hard',
    enabled: true,
  },
  {
    id: 'room_capacity',
    name: 'Room Capacity',
    description: 'Room capacity must meet enrollment requirements',
    type: 'ROOM_CAPACITY',
    severity: 'hard',
    enabled: true,
  },
  {
    id: 'prefer_morning',
    name: 'Prefer Morning Classes',
    description: 'Score higher for morning classes (before noon)',
    type: 'PREFER_MORNING',
    severity: 'soft',
    enabled: false,
  },
  {
    id: 'prefer_afternoon',
    name: 'Prefer Afternoon Classes',
    description: 'Score higher for afternoon classes (after noon)',
    type: 'PREFER_AFTERNOON',
    severity: 'soft',
    enabled: false,
  },
  {
    id: 'minimize_gaps',
    name: 'Minimize Gaps Between Classes',
    description: 'Penalize large dead time between classes',
    type: 'MINIMIZE_GAPS',
    severity: 'soft',
    enabled: false,
  },
  {
    id: 'cluster_days',
    name: 'Cluster Classes to Fewer Days',
    description: 'Reward schedules that free up entire days',
    type: 'CLUSTER_DAYS',
    severity: 'soft',
    enabled: false,
  },
  {
    id: 'building_proximity',
    name: 'Building Proximity',
    description: 'Prefer same or adjacent buildings for back-to-back classes',
    type: 'BUILDING_PROXIMITY',
    severity: 'soft',
    enabled: false,
  },
  {
    id: 'minimize_extremes',
    name: 'Minimize Early/Late Extremes',
    description: 'Penalize 7am or 7pm+ slots unless preferred',
    type: 'MINIMIZE_EXTREMES',
    severity: 'soft',
    enabled: false,
  },
  {
    id: 'balanced_load',
    name: 'Balanced Daily Load',
    description: 'Penalize days with 4+ classes or 0 classes',
    type: 'BALANCED_LOAD',
    severity: 'soft',
    enabled: false,
  },
];

export const DEFAULT_PREFERENCES: StudentPreferences = {
  preferMornings: false,
  preferAfternoons: false,
  minimizeGaps: false,
  clusterDays: false,
  buildingProximity: false,
  minimizeExtremes: false,
  balancedLoad: false,
  daysOff: [],
};
