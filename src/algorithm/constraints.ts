import { Building, Conflict, Constraint, Course, Instructor, Room, Section, StudentPreferences, StudentSchedule } from '../types';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export interface SolverResult {
  valid: boolean;
  conflicts: Conflict[];
  softConflicts: Conflict[];
}

interface SolverContext {
  catalog: Course[];
  rooms: Room[];
  buildings: Building[];
  instructors: Instructor[];
  constraints: Constraint[];
  instructorConstraints: Constraint[];
  preferences: StudentPreferences;
}

const getRoomBuilding = (roomId: string, rooms: Room[]): string | null => {
  const room = rooms.find(r => r.id === roomId);
  return room?.buildingId || null;
};

const getBuildingName = (buildingId: string, buildings: Building[]): string => {
  const building = buildings.find(b => b.id === buildingId);
  return building?.shortName || buildingId;
};

const formatTime = (decimalTime: number): string => {
  const hours = Math.floor(decimalTime);
  const minutes = Math.round((decimalTime - hours) * 60);
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours > 12 ? hours - 12 : hours;
  return `${displayHour}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const formatDay = (day: number): string => DAYS[day - 1] || `Day ${day}`;

export const checkTimeOverlap = (s1: Section, s2: Section): boolean => {
  return s1.timeslot.day === s2.timeslot.day &&
    Math.max(s1.timeslot.start, s2.timeslot.start) < Math.min(s1.timeslot.end, s2.timeslot.end);
};

export const checkBuildingBackToBack = (
  s1: Section,
  s2: Section,
  rooms: Room[],
  transitMinutes: number = 30
): { violates: boolean; gap: number } => {
  if (s1.timeslot.day !== s2.timeslot.day) {
    return { violates: false, gap: 0 };
  }

  const building1 = getRoomBuilding(s1.roomId, rooms);
  const building2 = getRoomBuilding(s2.roomId, rooms);

  if (!building1 || !building2 || building1 === building2) {
    return { violates: false, gap: 0 };
  }

  const end1 = s1.timeslot.end;
  const start2 = s2.timeslot.start;
  const gap = start2 - end1;

  if (gap >= 0 && gap < transitMinutes / 60) {
    return { violates: true, gap };
  }

  const end2 = s2.timeslot.end;
  const start1 = s1.timeslot.start;
  const gapReverse = start1 - end2;

  if (gapReverse >= 0 && gapReverse < transitMinutes / 60) {
    return { violates: true, gap: gapReverse };
  }

  return { violates: false, gap };
};

export const checkInstructorAvailability = (
  section: Section,
  instructor: Instructor
): { available: boolean; message?: string } => {
  const slot = instructor.availability.find(a => a.day === section.timeslot.day);
  
  if (!slot) {
    return { 
      available: false, 
      message: `${instructor.name} is not available on ${formatDay(section.timeslot.day)}s` 
    };
  }

  if (section.timeslot.start < slot.start || section.timeslot.end > slot.end) {
    return { 
      available: false, 
      message: `${instructor.name} is only available ${formatTime(slot.start)}-${formatTime(slot.end)} on ${formatDay(section.timeslot.day)}s, but class is ${formatTime(section.timeslot.start)}-${formatTime(section.timeslot.end)}` 
    };
  }

  return { available: true };
};

export const validateSchedule = (
  sections: Section[],
  context: SolverContext
): SolverResult => {
  const conflicts: Conflict[] = [];
  const softConflicts: Conflict[] = [];
  
  const allConstraints = [...context.constraints, ...context.instructorConstraints];
  const enabledHardConstraints = allConstraints.filter(c => c.severity === 'hard' && c.enabled);
  const enabledSoftConstraints = allConstraints.filter(c => c.severity === 'soft' && c.enabled);

  const usedSlots = new Map<string, Section[]>();
  sections.forEach(s => {
    const key = `${s.roomId}_${s.timeslot.day}_${s.timeslot.start}`;
    const existing = usedSlots.get(key) || [];
    existing.push(s);
    usedSlots.set(key, existing);
  });

  for (const constraint of enabledHardConstraints) {
    if (constraint.type === 'TIME_OVERLAP') {
      for (let i = 0; i < sections.length; i++) {
        for (let j = i + 1; j < sections.length; j++) {
          if (checkTimeOverlap(sections[i], sections[j])) {
            const course1 = context.catalog.find(c => c.id === sections[i].courseId);
            const course2 = context.catalog.find(c => c.id === sections[j].courseId);
            conflicts.push({
              id: `conflict_${i}_${j}_time`,
              type: 'TIME_OVERLAP',
              sectionIds: [sections[i].id, sections[j].id],
              message: `${course1?.code || sections[i].id} and ${course2?.code || sections[j].id} overlap on ${formatDay(sections[i].timeslot.day)} from ${formatTime(sections[i].timeslot.start)}-${formatTime(Math.max(sections[i].timeslot.end, sections[j].timeslot.end))}`,
              severity: 'hard',
              suggestion: `Choose different sections for ${course1?.code} or ${course2?.code}`
            });
          }
        }
      }
    }

    if (constraint.type === 'INSTRUCTOR_CONFLICT') {
      for (let i = 0; i < sections.length; i++) {
        for (let j = i + 1; j < sections.length; j++) {
          const s1 = sections[i];
          const s2 = sections[j];

          if (s1.instructorId === s2.instructorId && checkTimeOverlap(s1, s2)) {
            const course1 = context.catalog.find(c => c.id === s1.courseId);
            const course2 = context.catalog.find(c => c.id === s2.courseId);
            const instructor = context.instructors.find(inst => inst.id === s1.instructorId);

            conflicts.push({
              id: `conflict_${i}_${j}_instructor`,
              type: 'INSTRUCTOR_CONFLICT',
              sectionIds: [s1.id, s2.id],
              message: `${instructor?.name} is assigned to both ${course1?.code} and ${course2?.code} at the same time`,
              severity: 'hard',
              suggestion: `Choose different time slots for these courses`
            });
          }
        }
      }
    }

    if (constraint.type === 'ROOM_CONFLICT') {
      for (let i = 0; i < sections.length; i++) {
        for (let j = i + 1; j < sections.length; j++) {
          const s1 = sections[i];
          const s2 = sections[j];

          if (s1.roomId === s2.roomId && checkTimeOverlap(s1, s2)) {
            const course1 = context.catalog.find(c => c.id === s1.courseId);
            const course2 = context.catalog.find(c => c.id === s2.courseId);
            const room = context.rooms.find(r => r.id === s1.roomId);

            conflicts.push({
              id: `conflict_${i}_${j}_room`,
              type: 'ROOM_CONFLICT',
              sectionIds: [s1.id, s2.id],
              message: `${room?.name || s1.roomId} is assigned to both ${course1?.code} and ${course2?.code} at the same time`,
              severity: 'hard',
              suggestion: `Choose different rooms for these courses`
            });
          }
        }
      }
    }

    if (constraint.type === 'ROOM_CAPACITY') {
      for (const section of sections) {
        const room = context.rooms.find(r => r.id === section.roomId);
        const course = context.catalog.find(c => c.id === section.courseId);
        const enrolled = section.enrolledStudents || (course?.sections.length || 30);

        if (room && enrolled > room.capacity) {
          conflicts.push({
            id: `conflict_capacity_${section.id}`,
            type: 'ROOM_CAPACITY',
            sectionIds: [section.id],
            message: `${room.name} capacity (${room.capacity}) exceeded by ${course?.code || section.courseId} (${enrolled} students)`,
            severity: 'hard',
            suggestion: `Choose a room with higher capacity for ${course?.code}`
          });
        }
      }
    }

    if (constraint.type === 'PREREQUISITE_ORDERING') {
      for (const section of sections) {
        const course = context.catalog.find(c => c.id === section.courseId);
        if (!course?.prerequisites) continue;

        for (const prereqId of course.prerequisites) {
          const prereqCourse = context.catalog.find(c => c.id === prereqId);
          if (!prereqCourse?.semester) continue;

          const currentSemester = course.semester || 1;
          if (currentSemester <= prereqCourse.semester) {
            conflicts.push({
              id: `conflict_prereq_${section.id}`,
              type: 'PREREQUISITE_ORDERING',
              sectionIds: [section.id],
              message: `${course.code} (Semester ${currentSemester}) requires ${prereqCourse.code} to be completed first`,
              severity: 'hard',
              suggestion: `Complete ${prereqCourse.code} in an earlier semester before taking ${course.code}`
            });
          }
        }
      }
    }

    if (constraint.type === 'SECTION_UNIQUENESS') {
      const sectionRoomDaySlots = new Map<string, string[]>();
      for (const section of sections) {
        const key = `${section.courseId}_${section.roomId}_${section.timeslot.day}_${section.timeslot.start}`;
        const existing = sectionRoomDaySlots.get(key) || [];
        existing.push(section.id);
        sectionRoomDaySlots.set(key, existing);
      }

      for (const [key, sectionIds] of sectionRoomDaySlots) {
        if (sectionIds.length > 1) {
          conflicts.push({
            id: `conflict_unique_${key}`,
            type: 'SECTION_UNIQUENESS',
            sectionIds: sectionIds,
            message: `Course section assigned to multiple room/timeslot combinations`,
            severity: 'hard',
            suggestion: `Each section should have only one room/timeslot assignment`
          });
        }
      }
    }

    if (constraint.type === 'INSTRUCTOR_UNAVAILABLE') {
      for (const section of sections) {
        const instructor = context.instructors.find(i => i.id === section.instructorId);
        if (instructor) {
          const { available, message } = checkInstructorAvailability(section, instructor);
          if (!available) {
            const course = context.catalog.find(c => c.id === section.courseId);
            conflicts.push({
              id: `conflict_${section.id}_instructor`,
              type: 'INSTRUCTOR_UNAVAILABLE',
              sectionIds: [section.id],
              message: message || `${instructor.name} is not available for ${course?.code || section.courseId} at this time`,
              severity: 'hard',
              suggestion: `Choose a different time slot or contact ${instructor.name}`
            });
          }
        }
      }
    }

    for (let i = 0; i < sections.length; i++) {
      for (let j = i + 1; j < sections.length; j++) {
        const { violates, gap } = checkBuildingBackToBack(sections[i], sections[j], context.rooms, 30);
        if (violates) {
          const course1 = context.catalog.find(c => c.id === sections[i].courseId);
          const course2 = context.catalog.find(c => c.id === sections[j].courseId);
          const building1 = getRoomBuilding(sections[i].roomId, context.rooms);
          const building2 = getRoomBuilding(sections[j].roomId, context.rooms);
          
          const existingConflict = conflicts.find(c => 
            c.type === 'BUILDING_TRAVEL' && 
            c.sectionIds.includes(sections[i].id) && 
            c.sectionIds.includes(sections[j].id)
          );
          
          if (!existingConflict) {
            conflicts.push({
              id: `conflict_${i}_${j}_building`,
              type: 'BUILDING_TRAVEL',
              sectionIds: [sections[i].id, sections[j].id],
              message: `${course1?.code || sections[i].id} in ${getBuildingName(building1!, context.buildings)} and ${course2?.code || sections[j].id} in ${getBuildingName(building2!, context.buildings)} have only ${Math.round(gap * 60)} min gap on ${formatDay(sections[i].timeslot.day)} (need 30 min to travel)`,
              severity: 'hard',
              suggestion: `Move one class to the same building or allow a 30+ minute gap between classes`
            });
          }
        }
      }
    }
  }

  for (const constraint of enabledSoftConstraints) {
    if (constraint.type === 'MINIMIZE_GAPS' && context.preferences.minimizeGaps) {
      const gaps: { day: number; gap: number; courses: string[] }[] = [];
      
      for (let i = 0; i < sections.length; i++) {
        for (let j = i + 1; j < sections.length; j++) {
          const s1 = sections[i];
          const s2 = sections[j];
          
          if (s1.timeslot.day === s2.timeslot.day) {
            const end1 = s1.timeslot.end;
            const start2 = s2.timeslot.start;
            const gap = start2 - end1;
            
            if (gap > 0) {
              const course1 = context.catalog.find(c => c.id === s1.courseId);
              const course2 = context.catalog.find(c => c.id === s2.courseId);
              gaps.push({
                day: s1.timeslot.day,
                gap,
                courses: [course1?.code || s1.courseId, course2?.code || s2.courseId]
              });
            }
          }
        }
      }
      
      const totalGaps = gaps.reduce((sum, g) => sum + g.gap, 0);
      
if (totalGaps > 2) {
        softConflicts.push({
          id: 'soft_gap',
          type: 'MINIMIZE_GAPS',
          sectionIds: gaps.flatMap(g => sections.filter(s => s.timeslot.day === g.day).map(s => s.id)),
          message: `Schedule has ${totalGaps.toFixed(1)} hours of gaps between classes on multiple days`,
          severity: 'soft',
          suggestion: 'Consider selecting sections that create a more compact schedule'
        });
      }
    }

    if (constraint.type === 'CLUSTER_DAYS' && context.preferences.clusterDays) {
      const daysUsed = new Set(sections.map(s => s.timeslot.day));
      const daysUsedCount = daysUsed.size;
      const classPerDay: Record<number, number> = {};
      
      sections.forEach(s => {
        classPerDay[s.timeslot.day] = (classPerDay[s.timeslot.day] || 0) + 1;
      });
      
      const maxClassesInDay = Math.max(...Object.values(classPerDay), 0);
      const clusterScore = (daysUsedCount / 5) * (maxClassesInDay / Math.max(sections.length, 1));
      
      if (clusterScore < 0.4) {
        softConflicts.push({
          id: 'soft_cluster',
          type: 'CLUSTER_DAYS',
          sectionIds: sections.map(s => s.id),
          message: `Classes spread across ${daysUsedCount} days - not optimally clustered`,
          severity: 'soft',
          suggestion: 'Consider sections that cluster classes to fewer days'
        });
      }
    }

    if (constraint.type === 'BUILDING_PROXIMITY' && context.preferences.buildingProximity) {
      const crossBuildingPairs: string[] = [];
      
      for (let i = 0; i < sections.length; i++) {
        for (let j = i + 1; j < sections.length; j++) {
          const b1 = getRoomBuilding(sections[i].roomId, context.rooms);
          const b2 = getRoomBuilding(sections[j].roomId, context.rooms);
          
          if (b1 && b2 && b1 !== b2) {
            const building1 = context.buildings.find(b => b.id === b1);
            const building2 = context.buildings.find(b => b.id === b2);
            
            const isAdjacent = building1?.adjacentBuildings?.includes(b2) || 
                             building2?.adjacentBuildings?.includes(b1);
            
            if (!isAdjacent) {
              crossBuildingPairs.push(`${getBuildingName(b1, context.buildings)}-${getBuildingName(b2, context.buildings)}`);
            }
          }
        }
      }
      
      if (crossBuildingPairs.length > 2) {
        softConflicts.push({
          id: 'soft_building_proximity',
          type: 'BUILDING_PROXIMITY',
          sectionIds: sections.map(s => s.id),
          message: `Many classes in non-adjacent buildings`,
          severity: 'soft',
          suggestion: 'Consider selecting sections that keep classes in same or adjacent buildings'
        });
      }
    }

    if (constraint.type === 'MINIMIZE_EXTREMES' && context.preferences.minimizeExtremes) {
      const extremeClasses = sections.filter(s => s.timeslot.start < 8 || s.timeslot.start >= 19);
      
      if (extremeClasses.length > 0) {
        softConflicts.push({
          id: 'soft_extremes',
          type: 'MINIMIZE_EXTREMES',
          sectionIds: extremeClasses.map(s => s.id),
          message: `${extremeClasses.length} class(es) at extreme hours (before 8am or after 7pm)`,
          severity: 'soft',
          suggestion: 'Consider sections with more moderate start times'
        });
      }
    }

    if (constraint.type === 'BALANCED_LOAD' && context.preferences.balancedLoad) {
      const classPerDay: Record<number, number> = {};
      
      sections.forEach(s => {
        classPerDay[s.timeslot.day] = (classPerDay[s.timeslot.day] || 0) + 1;
      });
      
      const counts = Object.values(classPerDay);
      const maxClasses = Math.max(...counts, 0);
      const emptyDays = 5 - counts.length;
      
      if (maxClasses >= 4 || emptyDays >= 2) {
        softConflicts.push({
          id: 'soft_balanced',
          type: 'BALANCED_LOAD',
          sectionIds: sections.map(s => s.id),
          message: `Unbalanced daily load: ${maxClasses} max/day, ${emptyDays} empty days`,
          severity: 'soft',
          suggestion: 'Consider a more balanced distribution of classes across days'
        });
      }
    }

    if (constraint.type === 'DAYS_OFF' && context.preferences.daysOff.length > 0) {
      const daysUsed = new Set(sections.map(s => s.timeslot.day));
      const daysOffUsed = context.preferences.daysOff.filter(d => daysUsed.has(d));
      
      if (daysOffUsed.length > 0) {
        softConflicts.push({
          id: 'soft_days_off',
          type: 'DAYS_OFF',
          sectionIds: sections.filter(s => daysOffUsed.includes(s.timeslot.day)).map(s => s.id),
          message: `Classes scheduled on preferred days off: ${daysOffUsed.map(d => formatDay(d)).join(', ')}`,
          severity: 'soft',
          suggestion: `Select different sections to avoid classes on ${daysOffUsed.map(d => formatDay(d)).join(' and ')}`
        });
      }
    }

    if (constraint.type === 'PREFER_MORNING' && context.preferences.preferMornings) {
      const morningClasses = sections.filter(s => s.timeslot.start < 12);
      const afternoonClasses = sections.filter(s => s.timeslot.start >= 12);
      
      if (afternoonClasses.length > morningClasses.length) {
        softConflicts.push({
          id: 'soft_morning',
          type: 'PREFER_MORNING',
          sectionIds: afternoonClasses.map(s => s.id),
          message: `Schedule has more afternoon (${afternoonClasses.length}) than morning (${morningClasses.length}) classes`,
          severity: 'soft',
          suggestion: 'Select morning sections to match your morning preference'
        });
      }
    }

    if (constraint.type === 'PREFER_AFTERNOON' && context.preferences.preferAfternoons) {
      const morningClasses = sections.filter(s => s.timeslot.start < 12);
      const afternoonClasses = sections.filter(s => s.timeslot.start >= 12);
      
      if (morningClasses.length > afternoonClasses.length) {
        softConflicts.push({
          id: 'soft_afternoon',
          type: 'PREFER_AFTERNOON',
          sectionIds: morningClasses.map(s => s.id),
          message: `Schedule has more morning (${morningClasses.length}) than afternoon (${afternoonClasses.length}) classes`,
          severity: 'soft',
          suggestion: 'Select afternoon sections to match your afternoon preference'
        });
      }
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    softConflicts
  };
};

const getCombinations = (courses: Course[]): Section[][] => {
  if (courses.length === 0) return [];
  if (courses.length === 1) return courses[0].sections.map(s => [s]);

  const result: Section[][] = [];
  const restCombinations = getCombinations(courses.slice(1));

  for (const section of courses[0].sections) {
    for (const combo of restCombinations) {
      result.push([section, ...combo]);
    }
  }
  return result;
};

const scoreSchedule = (
  sections: Section[], 
  prefs: StudentPreferences,
  softConflicts: Conflict[]
): { score: number; details: string[] } => {
  let score = 100;
  const details: string[] = [];

  let morningCount = 0;
  let afternoonCount = 0;
  const daysUsed = new Set<number>();
  let totalGaps = 0;
  const byDay: Record<number, Section[]> = {};

  sections.forEach(s => {
    daysUsed.add(s.timeslot.day);
    
    if (s.timeslot.start < 12) morningCount++;
    else afternoonCount++;
    
    if (!byDay[s.timeslot.day]) byDay[s.timeslot.day] = [];
    byDay[s.timeslot.day].push(s);
  });

  Object.values(byDay).forEach(daySections => {
    daySections.sort((a, b) => a.timeslot.start - b.timeslot.start);
    for (let i = 0; i < daySections.length - 1; i++) {
      const gap = daySections[i+1].timeslot.start - daySections[i].timeslot.end;
      if (gap > 0) totalGaps += gap;
    }
  });

  if (prefs.preferMornings) {
    const diff = morningCount - afternoonCount;
    if (diff > 0) {
      score += Math.min(10 + diff * 3, 25);
      details.push("Morning preference satisfied");
    } else if (diff < 0) {
      score -= Math.min(5 + Math.abs(diff) * 3, 20);
      details.push("More afternoon than morning classes");
    }
  }

  if (prefs.preferAfternoons) {
    const diff = afternoonCount - morningCount;
    if (diff > 0) {
      score += Math.min(10 + diff * 3, 25);
      details.push("Afternoon preference satisfied");
    } else if (diff < 0) {
      score -= Math.min(5 + Math.abs(diff) * 3, 20);
      details.push("More morning than afternoon classes");
    }
  }

  if (prefs.minimizeGaps) {
    if (totalGaps === 0 && sections.length > 1) {
      score += 15;
      details.push("Compact schedule with no gaps");
    } else if (totalGaps > 0) {
      score -= Math.min(totalGaps * 5, 20);
      details.push(`${totalGaps.toFixed(1)} hours of gaps between classes`);
    } else {
      score += 5;
    }
  }

  if (prefs.clusterDays) {
    const daysUsedCount = daysUsed.size;
    if (daysUsedCount <= 2) {
      score += 15;
      details.push("Classes clustered to very few days");
    } else if (daysUsedCount <= 3) {
      score += 10;
      details.push("Classes clustered to few days");
    } else if (daysUsedCount >= 5) {
      score -= 10;
      details.push("Classes spread across many days");
    } else {
      score -= 5;
    }
  }

  if (prefs.minimizeExtremes) {
    const extremeClasses = sections.filter(s => s.timeslot.start < 8 || s.timeslot.start >= 19);
    if (extremeClasses.length === 0) {
      score += 10;
      details.push("No extreme early/late classes");
    } else {
      score -= extremeClasses.length * 5;
    }
  }

  if (prefs.balancedLoad) {
    const classPerDay: Record<number, number> = {};
    sections.forEach(s => {
      classPerDay[s.timeslot.day] = (classPerDay[s.timeslot.day] || 0) + 1;
    });
    const counts = Object.values(classPerDay);
    const maxClasses = Math.max(...counts, 0);
    const emptyDays = 5 - counts.length;
    const imbalance = Math.abs(maxClasses - 2);
    if (maxClasses <= 2 && emptyDays <= 1) {
      score += 15;
      details.push("Perfectly balanced daily load");
    } else if (maxClasses <= 3 && emptyDays <= 1) {
      score += 10;
      details.push("Balanced daily load");
    } else {
      score -= imbalance * 5 + emptyDays * 3;
    }
  }

  if (prefs.daysOff.length > 0) {
    let hasClassOnDayOff = false;
    prefs.daysOff.forEach(day => {
      if (daysUsed.has(day)) {
        hasClassOnDayOff = true;
        details.push(`${formatDay(day)} is a preferred day off but has class`);
      }
    });

    if (!hasClassOnDayOff) {
      score += 15;
      details.push("All preferred days off kept free");
    } else {
      score -= 10;
    }
  }

  score -= softConflicts.length * 10;

  score = Math.max(0, Math.min(150, score));
  
  if (details.length === 0) {
    details.push("Valid schedule");
  }

  return { score, details };
};

export const generateTopSchedules = (
  cartIds: string[],
  catalog: Course[],
  rooms: Room[],
  buildings: Building[],
  instructors: Instructor[],
  constraints: Constraint[],
  instructorConstraints: Constraint[],
  preferences: StudentPreferences
): StudentSchedule[] => {
  const selectedCourses = catalog.filter(c => cartIds.includes(c.id));
  
  if (selectedCourses.length === 0) return [];

  const context: SolverContext = {
    catalog,
    rooms,
    buildings,
    instructors,
    constraints,
    instructorConstraints,
    preferences
  };

  const allCombinations = getCombinations(selectedCourses);
  
  const validSchedules: StudentSchedule[] = [];

  for (const combo of allCombinations) {
    const { valid, softConflicts } = validateSchedule(combo, context);
    
    if (valid) {
      const { score, details } = scoreSchedule(combo, preferences, softConflicts);
      validSchedules.push({
        id: `sch_${validSchedules.length}_${Math.random().toString(36).substring(2, 7)}`,
        sections: combo,
        score,
        matchDetails: details,
        conflicts: softConflicts
      });
    }
  }

  const scoredForDiversity = validSchedules.map(s => {
    const daysUsed = new Set(s.sections.map(sec => sec.timeslot.day)).size;
    const byDay: Record<number, number> = {};
    s.sections.forEach(sec => {
      byDay[sec.timeslot.day] = (byDay[sec.timeslot.day] || 0) + 1;
    });
    const maxPerDay = Math.max(...Object.values(byDay), 0);
    const diversityScore = daysUsed * 10 - maxPerDay * 5;
    return { ...s, diversityScore };
  });
  
  const sortedValid = scoredForDiversity
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (b.diversityScore !== a.diversityScore) return b.diversityScore - a.diversityScore;
      const aIds = a.sections.map(s => s.id).sort().join(',');
      const bIds = b.sections.map(s => s.id).sort().join(',');
      return aIds.localeCompare(bIds);
    });
  
  const uniqueSchedules: StudentSchedule[] = [];
  const seenSectionKeys = new Set<string>();
  
  for (const schedule of sortedValid) {
    const sectionKey = schedule.sections.map(s => s.id).sort().join('|');
    if (!seenSectionKeys.has(sectionKey)) {
      seenSectionKeys.add(sectionKey);
      uniqueSchedules.push({
        id: schedule.id,
        sections: schedule.sections,
        score: schedule.score,
        matchDetails: schedule.matchDetails,
        conflicts: schedule.conflicts
      });
    }
    if (uniqueSchedules.length >= 3) break;
  }
  
  return uniqueSchedules;
};