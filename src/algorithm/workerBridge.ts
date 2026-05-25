import { useStore } from '../store/useStore';
import { generateTopSchedules } from './constraints';
import { SEED_INSTRUCTORS } from '../utils/seed';

export const runStudentSolver = () => {
  const store = useStore.getState();
  
  if (store.cart.length === 0) {
    alert("Please add at least one course to your cart!");
    return;
  }

  store.setIsSolving(true);

  setTimeout(() => {
    try {
      const topSchedules = generateTopSchedules(
        store.cart, 
        store.catalog, 
        store.rooms,
        store.buildings,
        SEED_INSTRUCTORS,
        store.constraints,
        store.instructorConstraints,
        store.preferences
      );
      
      store.setGeneratedSchedules(topSchedules);
      
      if (topSchedules.length === 0) {
        alert("No valid schedules found! Try adjusting your courses or constraints.");
      }
    } catch (error) {
      console.error("Solver error:", error);
      alert("Failed to generate schedules. Please try again.");
    } finally {
      store.setIsSolving(false);
    }
  }, 50);
};
