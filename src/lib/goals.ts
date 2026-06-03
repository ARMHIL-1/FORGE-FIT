import { UserProfile } from '../types';

export function calculateTargets(profile: Partial<UserProfile>): Partial<UserProfile> {
  const weightKg = Number(profile.weightKg);
  const heightCm = Number(profile.heightCm);
  const age = Number(profile.age);
  const gender = profile.gender;
  const activityLevel = profile.activityLevel;
  const goal = profile.goal;

  if (!weightKg || !heightCm || !age || !gender || !activityLevel || !goal) {
    return profile;
  }

  if (isNaN(weightKg) || isNaN(heightCm) || isNaN(age)) {
    return profile;
  }

  // Mifflin-St Jeor Equation
  let bmr = (10 * weightKg) + (6.25 * heightCm) - (5 * age);
  if (gender === 'male') {
    bmr += 5;
  } else {
    bmr -= 161;
  }

  // Activity Multiplier
  const activeMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier = activeMultipliers[activityLevel as keyof typeof activeMultipliers] || 1.2;
  let calories = bmr * multiplier;

  // Goal Adjustment
  if (goal === 'bulking') {
    calories += 500;
  } else if (goal === 'cutting') {
    calories -= 500;
  } else if (goal === 'recomposition') {
    calories -= 100;
  } else if (goal === 'strength') {
    calories += 250;
  }

  // Macronutrient calculation
  // Protein: 2.2g per kg (approx 1g per lb)
  const protein = weightKg * 2.2;
  
  // Fat: ~25% of total calories
  const fatCalories = calories * 0.25;
  const fat = fatCalories / 9;

  // Carbs: Remainder
  const proteinCalories = protein * 4;
  const carbCalories = calories - proteinCalories - fatCalories;
  const carbs = carbCalories / 4;

  return {
    ...profile,
    targetDailyCalories: Math.round(calories),
    targetDailyProtein: Math.round(protein),
    targetDailyCarbs: Math.round(carbs),
    targetDailyFat: Math.round(fat),
  };
}
