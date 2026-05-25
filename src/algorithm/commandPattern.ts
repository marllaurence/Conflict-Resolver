import { StudentPreferences } from '../types';
import { useStore } from '../store/useStore';

export interface Command {
  execute(): void;
  undo(): void;
  description: string;
}

export class ToggleCartCommand implements Command {
  private courseId: string;
  private wasAdded: boolean = false;

  constructor(courseId: string) {
    this.courseId = courseId;
  }

  execute(): void {
    const store = useStore.getState();
    this.wasAdded = !store.cart.includes(this.courseId);
    store.toggleCartItem(this.courseId);
  }

  undo(): void {
    const store = useStore.getState();
    if (this.wasAdded) {
      if (!store.cart.includes(this.courseId)) {
        store.cart.push(this.courseId);
      }
    } else {
      store.cart = store.cart.filter(id => id !== this.courseId);
    }
  }

  get description(): string {
    return this.wasAdded ? `Added ${this.courseId} to cart` : `Removed ${this.courseId} from cart`;
  }
}

export class UpdatePreferencesCommand implements Command {
  private previousPrefs: StudentPreferences;
  private newPrefs: Partial<StudentPreferences>;

  constructor(newPrefs: Partial<StudentPreferences>) {
    this.previousPrefs = { ...useStore.getState().preferences };
    this.newPrefs = newPrefs;
  }

  execute(): void {
    useStore.getState().updatePreferences(this.newPrefs);
  }

  undo(): void {
    useStore.getState().updatePreferences(this.previousPrefs);
  }

  get description(): string {
    return `Updated preferences: ${Object.keys(this.newPrefs).join(', ')}`;
  }
}

export class ToggleConstraintCommand implements Command {
  private constraintId: string;
  private wasEnabled: boolean = false;

  constructor(constraintId: string) {
    this.constraintId = constraintId;
    const constraint = [...useStore.getState().constraints, ...useStore.getState().instructorConstraints]
      .find(c => c.id === constraintId);
    this.wasEnabled = constraint?.enabled ?? false;
  }

  execute(): void {
    useStore.getState().toggleConstraint(this.constraintId);
  }

  undo(): void {
    const store = useStore.getState();
    store.toggleConstraint(this.constraintId);
  }

  get description(): string {
    return this.wasEnabled ? `Disabled constraint ${this.constraintId}` : `Enabled constraint ${this.constraintId}`;
  }
}

export class CommandHistory {
  private history: Command[] = [];
  private currentIndex: number = -1;
  private maxHistory: number = 50;

  execute(command: Command): void {
    command.execute();
    
    this.history = this.history.slice(0, this.currentIndex + 1);
    this.history.push(command);
    
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.currentIndex++;
    }
  }

  undo(): Command | null {
    if (this.currentIndex >= 0) {
      const command = this.history[this.currentIndex];
      command.undo();
      this.currentIndex--;
      return command;
    }
    return null;
  }

  redo(): Command | null {
    if (this.currentIndex < this.history.length - 1) {
      this.currentIndex++;
      const command = this.history[this.currentIndex];
      command.execute();
      return command;
    }
    return null;
  }

  canUndo(): boolean {
    return this.currentIndex >= 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  getHistory(): string[] {
    return this.history.map((cmd, i) => `${i <= this.currentIndex ? '✓ ' : '  '}${cmd.description}`);
  }

  clear(): void {
    this.history = [];
    this.currentIndex = -1;
  }
}

export const commandHistory = new CommandHistory();
