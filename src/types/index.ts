export interface Building {
  id: string;
  name: string;
  shortName: string;
  adjacentBuildings?: string[];
}

export interface Room {
  id: string;
  name: string;
  capacity: number;
  buildingId: string;
}

export interface Instructor {
  id: string;
  name: string;
  availability: { day: number; start: number; end: number }[];
  constraints: string[];
}

export interface Constraint {
  id: string;
  name: string;
  description: string;
  type: ConstraintType;
  severity: 'hard' | 'soft';
  enabled: boolean;
  params?: Record<string, unknown>;
}

export type ConstraintType = 
  | 'TIME_OVERLAP'
  | 'BUILDING_TRAVEL'
  | 'INSTRUCTOR_UNAVAILABLE'
  | 'INSTRUCTOR_CONFLICT'
  | 'ROOM_CONFLICT'
  | 'ROOM_CAPACITY'
  | 'PREREQUISITE_ORDERING'
  | 'SECTION_UNIQUENESS'
  | 'NO_BACK_TO_BACK_DIFFERENT_BUILDING'
  | 'PREFER_MORNING'
  | 'PREFER_AFTERNOON'
  | 'MINIMIZE_GAPS'
  | 'CLUSTER_DAYS'
  | 'BUILDING_PROXIMITY'
  | 'MINIMIZE_EXTREMES'
  | 'BALANCED_LOAD'
  | 'DAYS_OFF'
  | 'CONSTRAINT_VIOLATION';

export interface Conflict {
  id: string;
  type: ConstraintType;
  sectionIds: string[];
  message: string;
  severity: 'hard' | 'soft';
  suggestion?: string;
}

export interface Section {
  id: string;
  courseId: string;
  instructorId: string;
  roomId: string;
  timeslot: Timeslot;
  enrolledStudents?: number;
}

export interface Timeslot {
  day: number;
  start: number;
  end: number;
}

export interface Course {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  sections: Section[];
  prerequisites?: string[];
  semester?: number;
}

export interface StudentPreferences {
  preferMornings: boolean;
  preferAfternoons: boolean;
  minimizeGaps: boolean;
  clusterDays: boolean;
  buildingProximity: boolean;
  minimizeExtremes: boolean;
  balancedLoad: boolean;
  daysOff: number[];
}

export interface StudentSchedule {
  id: string;
  sections: Section[];
  score: number;
  matchDetails: string[];
  conflicts: Conflict[];
}
