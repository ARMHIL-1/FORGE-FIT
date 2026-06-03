export interface UserProfile {
  userId: string;
  name: string;
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  bodyFatPercentage?: number;
  activityLevel?: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  goal: 'cutting' | 'bulking' | 'recomposition' | 'strength' | 'endurance' | 'general' | '';
  experienceLevel?: 'beginner' | 'intermediate' | 'advanced';
  equipmentAvailable?: string;
  targetDailyCalories?: number;
  targetDailyProtein?: number;
  targetDailyCarbs?: number;
  targetDailyFat?: number;
  targetDailyHydrationMl?: number;
  createdAt: string;
}

export interface WeightLog {
  id: string;
  userId: string;
  date: string; // ISO date YYYY-MM-DD
  weightKg: number;
  bodyFatPercentage?: number;
}

export interface ExerciseSet {
  reps: number;
  weight: number;
  isCompleted: boolean;
}

export interface WorkoutExercise {
  name: string;
  sets: ExerciseSet[];
  notes?: string;
}

export interface WorkoutLog {
  id: string;
  userId: string;
  date: string; // ISO date-time
  routineName: string;
  exercises: WorkoutExercise[];
  notes?: string;
}

export interface NutritionLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  mealName: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  healthScore?: number;
  healthReason?: string;
  coachingInsight?: string;
  improvementSuggestion?: string;
  timestamp: string;
}

export interface HydrationLog {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  amountMl: number;
  timestamp: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface CoachState {
  history: ChatMessage[];
  isLoading: boolean;
}
