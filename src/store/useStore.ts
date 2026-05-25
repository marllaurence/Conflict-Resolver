import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Building, Constraint, Course, Room, StudentPreferences, StudentSchedule } from '../types';
import { DEFAULT_CONSTRAINTS, DEFAULT_PREFERENCES, SEED_BUILDINGS, SEED_COURSES, SEED_ROOMS } from '../utils/seed';

interface StoreState {
  catalog: Course[];                
  cart: string[];                   
  preferences: StudentPreferences;  
  generatedSchedules: StudentSchedule[]; 
  selectedScheduleIndex: number;
  isSolving: boolean;
  
  rooms: Room[]; 
  buildings: Building[];
  constraints: Constraint[];
  instructorConstraints: Constraint[];

  setSelectedScheduleIndex: (index: number) => void;
  
  toggleCartItem: (courseId: string) => void;
  updatePreferences: (prefs: Partial<StudentPreferences>) => void;
  setGeneratedSchedules: (schedules: StudentSchedule[]) => void;
  setIsSolving: (status: boolean) => void;
  toggleConstraint: (constraintId: string) => void;
  addInstructorConstraint: (constraint: Constraint) => void;
  removeInstructorConstraint: (constraintId: string) => void;
  
  addCourse: (course: Course) => void;
  updateCourse: (courseId: string, updates: Partial<Course>) => void;
  deleteCourse: (courseId: string) => void;
}

export const useStore = create<StoreState>()(
  immer((set) => ({
    catalog: SEED_COURSES,
    cart: [], 
    preferences: DEFAULT_PREFERENCES,
    generatedSchedules: [],
    selectedScheduleIndex: 0,
    isSolving: false,
    
    rooms: SEED_ROOMS, 
    buildings: SEED_BUILDINGS,
    constraints: DEFAULT_CONSTRAINTS,
    instructorConstraints: [],

    toggleCartItem: (courseId) => set((state) => {
      if (state.cart.includes(courseId)) {
        state.cart = state.cart.filter(id => id !== courseId);
      } else {
        state.cart.push(courseId);
      }
    }),

    updatePreferences: (prefs) => set((state) => {
      state.preferences = { ...state.preferences, ...prefs };
    }),

    setGeneratedSchedules: (schedules) => set((state) => {
      state.generatedSchedules = schedules;
    }),

    setIsSolving: (status) => set((state) => {
      state.isSolving = status;
    }),

    setSelectedScheduleIndex: (index) => set((state) => {
      state.selectedScheduleIndex = index;
    }),

    toggleConstraint: (constraintId) => set((state) => {
      const constraint = state.constraints.find(c => c.id === constraintId);
      if (constraint) {
        constraint.enabled = !constraint.enabled;
      }
      const instructorConstraint = state.instructorConstraints.find(c => c.id === constraintId);
      if (instructorConstraint) {
        instructorConstraint.enabled = !instructorConstraint.enabled;
      }
    }),

    addInstructorConstraint: (constraint) => set((state) => {
      const existing = state.instructorConstraints.find(c => c.id === constraint.id);
      if (!existing) {
        state.instructorConstraints.push(constraint);
      }
    }),

    removeInstructorConstraint: (constraintId) => set((state) => {
      state.instructorConstraints = state.instructorConstraints.filter(c => c.id !== constraintId);
    }),

    addCourse: (course) => set((state) => {
      const existing = state.catalog.find(c => c.id === course.id);
      if (!existing) {
        state.catalog.push(course);
      }
    }),

    updateCourse: (courseId, updates) => set((state) => {
      const index = state.catalog.findIndex(c => c.id === courseId);
      if (index !== -1) {
        state.catalog[index] = { ...state.catalog[index], ...updates };
      }
    }),

    deleteCourse: (courseId) => set((state) => {
      state.catalog = state.catalog.filter(c => c.id !== courseId);
      state.cart = state.cart.filter(id => id !== courseId);
    }),
  }))
);
