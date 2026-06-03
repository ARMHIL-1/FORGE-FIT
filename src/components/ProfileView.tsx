import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Target, 
  Dumbbell, 
  Scale, 
  ShieldCheck,
  ChevronRight,
  Zap,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { UserProfile } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, updateDoc, addDoc, collection } from 'firebase/firestore';

interface ProfileViewProps {
  userProfile: UserProfile;
  onUpdate: (profile: Partial<UserProfile>) => Promise<void>;
  needsOnboarding?: boolean;
}

export function ProfileView({ userProfile, onUpdate, needsOnboarding }: ProfileViewProps) {
  const [step, setStep] = useState(needsOnboarding ? 1 : 0); // 0 means standard view, 1-3 means onboarding steps
  const [formData, setFormData] = useState<UserProfile>(userProfile);
  const [isSaving, setIsSaving] = useState(false);

  const calculateMacros = (profile: UserProfile): Partial<UserProfile> => {
    // Mifflin-St Jeor Equation
    // Men: BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age (y) + 5
    // Women: BMR = 10 * weight (kg) + 6.25 * height (cm) - 5 * age (y) - 161
    
    if (!profile.weightKg || !profile.heightCm || !profile.age || !profile.gender) return {};

    let bmr = (10 * profile.weightKg) + (6.25 * profile.heightCm) - (5 * profile.age);
    if (profile.gender.toLowerCase() === 'male') {
      bmr += 5;
    } else {
      bmr -= 161;
    }

    // Activity Multipliers
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };

    const tdee = bmr * (multipliers[profile.activityLevel as keyof typeof multipliers] || 1.2);
    
    let targetCalories = tdee;
    let proteinMultiplier = 2.0; // g per kg of bodyweight
    let fatPercentage = 0.25; // 25% of calories from fat

    switch (profile.goal) {
      case 'bulking':
        targetCalories += 300;
        proteinMultiplier = 2.2;
        break;
      case 'cutting':
        targetCalories -= 500;
        proteinMultiplier = 2.4;
        break;
      case 'strength':
        targetCalories += 100;
        proteinMultiplier = 2.0;
        break;
      case 'endurance':
        targetCalories += 200;
        proteinMultiplier = 1.6;
        break;
      case 'recomposition':
        proteinMultiplier = 2.3;
        break;
    }

    const proteinGrams = Math.round(profile.weightKg * proteinMultiplier);
    const fatGrams = Math.round((targetCalories * fatPercentage) / 9);
    const carbGrams = Math.round((targetCalories - (proteinGrams * 4) - (fatGrams * 9)) / 4);

    return {
      targetDailyCalories: Math.round(targetCalories),
      targetDailyProtein: proteinGrams,
      targetDailyCarbs: carbGrams,
      targetDailyFat: fatGrams,
      targetDailyHydrationMl: Math.round(profile.weightKg * 33) // 33ml per kg
    };
  };

  const handleNextStep = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      // Final Step: Calculate and save
      const calculatedTargets = calculateMacros(formData);
      const finalData = { ...formData, ...calculatedTargets };
      saveProfile(finalData);
    }
  };

  const saveProfile = async (data: UserProfile) => {
    setIsSaving(true);
    try {
      await onUpdate(data);
      
      if (data.weightKg) {
        await addDoc(collection(db, 'weight_logs'), {
          userId: userProfile.userId,
          date: new Date().toISOString().split('T')[0],
          weightKg: data.weightKg
        });
      }
      setStep(0); // Exit onboarding
    } catch (error) {
      console.error("Profile update failed", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step > 0) {
      handleNextStep();
    } else {
      const calculatedTargets = calculateMacros(formData);
      saveProfile({ ...formData, ...calculatedTargets });
    }
  };

  if (step > 0) {
    return (
      <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in zoom-in duration-700 pb-20">
        <header className="text-center space-y-4">
          <div className="flex items-center justify-center gap-4">
             <div className="h-1 w-12 wine-gradient rounded-full"></div>
             <p className="text-forge-wine-light font-black uppercase tracking-[0.6em] text-[10px] italic glow-text-wine">Onboarding Sequence</p>
             <div className="h-1 w-12 wine-gradient rounded-full"></div>
          </div>
          <h2 className="text-5xl font-black text-white tracking-tighter uppercase italic glow-text-white">
            {step === 1 && "Identity Protocol"}
            {step === 2 && "Biometric Scan"}
            {step === 3 && "Tactical Objectives"}
          </h2>
          <div className="flex justify-center gap-3 mt-8">
            {[1, 2, 3].map((s) => (
              <div 
                key={s} 
                className={cn(
                  "h-1.5 w-16 rounded-full transition-all duration-500",
                  step >= s ? "wine-gradient shadow-[0_0_10px_rgba(122,17,40,0.5)]" : "bg-white/5"
                )}
              />
            ))}
          </div>
        </header>

        <form onSubmit={handleSubmit} className="glass-panel p-16 rounded-[3rem] shadow-2xl border-white/5 relative overflow-hidden backdrop-blur-3xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-forge-wine/5 blur-[120px] -z-10 opacity-30"></div>
          
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <InputField 
                    label="FullName/Alias" 
                    value={formData.name || ''} 
                    onChange={(v: string) => setFormData({...formData, name: v})}
                />
                <SelectField 
                    label="Gender Identity" 
                    value={formData.gender || ''} 
                    onChange={(v: string) => setFormData({...formData, gender: v})}
                    options={[
                        { value: 'male', label: 'MALE' },
                        { value: 'female', label: 'FEMALE' },
                        { value: 'other', label: 'DIVERSE' },
                    ]}
                />
                <InputField 
                    label="Chronological Age" 
                    type="number"
                    value={formData.age || ''} 
                    onChange={(v: string) => setFormData({...formData, age: Number(v)})}
                />
                <div className="flex flex-col justify-end">
                   <p className="text-[10px] text-forge-gray uppercase tracking-widest opacity-40 italic leading-relaxed">
                     Core identity data is used to calibrate metabolic baselines and hormone modeling.
                   </p>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <InputField 
                    label="Total System Mass (KG)" 
                    type="number"
                    value={formData.weightKg || ''} 
                    onChange={(v: string) => setFormData({...formData, weightKg: Number(v)})}
                />
                <InputField 
                    label="Stature Vertical (CM)" 
                    type="number"
                    value={formData.heightCm || ''} 
                    onChange={(v: string) => setFormData({...formData, heightCm: Number(v)})}
                />
                <div className="flex flex-col justify-end">
                   <p className="text-[10px] text-forge-gray uppercase tracking-widest opacity-40 italic leading-relaxed">
                     Hardware specifications allow for precision energy expenditure calculations.
                   </p>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <SelectField 
                    label="Primary Directive" 
                    value={formData.goal} 
                    onChange={(v: string) => setFormData({...formData, goal: v as any})}
                    options={[
                        { value: 'bulking', label: 'HYPERTROPHY / BULK' },
                        { value: 'cutting', label: 'FAT OXIDATION / CUT' },
                        { value: 'recomposition', label: 'RECOMPOSITION' },
                        { value: 'strength', label: 'POWER / STRENGTH' },
                        { value: 'endurance', label: 'CAPACITY / ENDURANCE' },
                    ]}
                />
                <SelectField 
                    label="Energy Flux Level" 
                    value={formData.activityLevel || ''} 
                    onChange={(v: string) => setFormData({...formData, activityLevel: v as any})}
                    options={[
                        { value: 'sedentary', label: 'SEDENTARY' },
                        { value: 'light', label: 'MODERATE FLUX' },
                        { value: 'moderate', label: 'ACTIVE FLUX' },
                        { value: 'active', label: 'HIGH FLUX' },
                        { value: 'very_active', label: 'EXTREME FLUX' },
                    ]}
                />
                <SelectField 
                    label="Neural Muscle Connection" 
                    value={formData.experienceLevel || ''} 
                    onChange={(v: string) => setFormData({...formData, experienceLevel: v as any})}
                    options={[
                        { value: 'beginner', label: 'NEOPHYTE' },
                        { value: 'intermediate', label: 'VETERAN' },
                        { value: 'advanced', label: 'ELITE' },
                    ]}
                />
                <SelectField 
                    label="Mechanical Inventory" 
                    value={formData.equipmentAvailable || ''} 
                    onChange={(v: string) => setFormData({...formData, equipmentAvailable: v})}
                    options={[
                        { value: 'full_gym', label: 'FULL GYM' },
                        { value: 'home_gym', label: 'HOME GYM (DUMBBELLS/BARBELLS)' },
                        { value: 'basic_home', label: 'BASIC HOME (DUMBBELLS/BANDS)' },
                        { value: 'bodyweight', label: 'BODYWEIGHT ONLY' },
                    ]}
                />
              </div>
            )}
          </motion.div>

          <footer className="mt-16 pt-10 border-t border-white/5 flex justify-between items-center">
            <button 
              type="button"
              disabled={step === 1}
              onClick={() => setStep(step - 1)}
              className="text-[10px] font-black text-forge-gray hover:text-white transition-all uppercase tracking-[0.4em] italic disabled:opacity-0"
            >
              Previous Phase
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="wine-gradient text-white font-black px-12 py-5 rounded-2xl italic tracking-[0.5em] uppercase text-[10px] transition-all shadow-2xl flex items-center gap-4 hover:scale-105 active:scale-95 glow-border"
            >
              {isSaving ? <Loader2 className="animate-spin" size={18} /> : step === 3 ? "Initialize System" : "Next Phase"}
              <ChevronRight size={18} />
            </button>
          </footer>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in duration-1000 pb-20">
      <header className="px-6 space-y-2">
        <div className="flex items-center gap-3 opacity-60">
           <div className="w-8 h-px wine-gradient rounded-full"></div>
           <p className="text-forge-gray font-black uppercase tracking-[0.4em] text-[9px] italic">Athlete Biometrics</p>
        </div>
        <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic glow-text-white">
          {needsOnboarding ? 'Initialize Neural Profile' : 'Neural Identity'}
        </h2>
        {needsOnboarding && (
          <p className="text-forge-wine-light text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Required: Define core parameters before tactical deployment.</p>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Col - Card */}
        <div className="lg:col-span-4 space-y-8">
          <div className="glass-panel p-12 rounded-[2.5rem] text-center relative overflow-hidden backdrop-blur-3xl shadow-2xl border-white/5 group">
            <div className="absolute top-0 inset-x-0 h-1.5 wine-gradient opacity-80" />
            <div className="relative mb-10 pt-4">
              <div className="w-32 h-32 glass-panel rounded-3xl mx-auto flex items-center justify-center border-white/10 shadow-2xl overflow-hidden relative group/avatar">
                <div className="absolute inset-0 bg-forge-wine/5 blur-2xl group-hover/avatar:bg-forge-wine/20 transition-all"></div>
                <User size={64} strokeWidth={1} className="text-forge-gray relative z-10 opacity-40 group-hover/avatar:scale-110 transition-transform" />
                <div className="absolute inset-0 bg-forge-wine/40 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm">
                  <Settings size={32} strokeWidth={2} className="text-white animate-spin-slow" />
                </div>
              </div>
              <div className="absolute -bottom-3 right-1/2 translate-x-16 wine-gradient text-white p-2 rounded-xl border-4 border-forge-black shadow-2xl glow-border">
                <ShieldCheck size={20} strokeWidth={3} />
              </div>
            </div>
            <h3 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter glow-text-white">{userProfile.name}</h3>
            <p className="text-forge-wine-light font-black text-[10px] uppercase tracking-[0.5em] mb-10 italic">Core Authenticated</p>
            
            <div className="flex flex-wrap gap-4 justify-center">
              <span className="px-5 py-2 glass-panel border-forge-wine/20 rounded-xl text-[10px] font-black text-forge-gray uppercase tracking-[0.3em] shadow-2xl group-hover:bg-forge-wine/5 transition-all">{userProfile.goal}</span>
              <span className="px-5 py-2 glass-panel border-forge-wine/20 rounded-xl text-[10px] font-black text-forge-gray uppercase tracking-[0.3em] shadow-2xl group-hover:bg-forge-wine/5 transition-all">{userProfile.experienceLevel}</span>
            </div>
          </div>

          <div className="glass-panel p-10 rounded-[2.5rem] space-y-10 shadow-2xl border-white/5 relative overflow-hidden">
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-forge-wine/5 blur-3xl opacity-50"></div>
            <h4 className="text-[11px] font-black text-white uppercase tracking-[0.6em] border-b border-white/5 pb-6 italic glow-text-white relative z-10">Telemetry Snapshot</h4>
            <div className="grid grid-cols-2 gap-6 relative z-10">
              <div className="glass-card p-6 rounded-2xl border-white/5 text-center group hover:border-forge-wine/30 transition-all">
                <Scale size={24} strokeWidth={1} className="mx-auto text-forge-gray mb-4 opacity-40 group-hover:text-forge-wine-light group-hover:opacity-100 group-hover:scale-110 transition-all" />
                <div className="text-2xl font-black text-white italic glow-text-white">{userProfile.weightKg || '--'}<span className="text-[10px] text-forge-gray not-italic uppercase tracking-[0.3em] ml-2 opacity-40">kg</span></div>
              </div>
              <div className="glass-card p-6 rounded-2xl border-white/5 text-center group hover:border-forge-wine/30 transition-all">
                <Target size={24} strokeWidth={1} className="mx-auto text-forge-gray mb-4 opacity-40 group-hover:text-forge-wine-light group-hover:opacity-100 group-hover:scale-110 transition-all" />
                <div className="text-2xl font-black text-white italic glow-text-white">{userProfile.heightCm || '--'}<span className="text-[10px] text-forge-gray not-italic uppercase tracking-[0.3em] ml-2 opacity-40">cm</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col - Settings Form */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="glass-panel p-10 rounded-[2.5rem] space-y-12 shadow-2xl border-white/5 relative overflow-hidden backdrop-blur-3xl">
            <div className="absolute top-0 right-0 w-80 h-80 bg-forge-wine/5 blur-[100px] -z-10 opacity-50"></div>
            <div>
              <div className="flex items-center gap-5 mb-10">
                 <div className="p-3 glass-panel rounded-xl wine-border-dim">
                    <Zap className="text-forge-wine-light glow-text-wine" size={20} strokeWidth={2.5} fill="currentColor" />
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white tracking-tighter uppercase italic glow-text-white">Profile Refinement</h3>
                    <p className="text-forge-gray text-[9px] font-black uppercase tracking-[0.4em] opacity-40 italic mt-1">Operational Parameters Update</p>
                 </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                <InputField 
                    label="Athlete Alias" 
                    value={formData.name || ''} 
                    onChange={(v) => setFormData({...formData, name: v})}
                />
                <SelectField 
                    label="Primary Directive" 
                    value={formData.goal} 
                    onChange={(v) => setFormData({...formData, goal: v as any})}
                    options={[
                        { value: 'bulking', label: 'BUILD MUSCLE' },
                        { value: 'cutting', label: 'FAT LOSS' },
                        { value: 'recomposition', label: 'BODY RECOMP' },
                        { value: 'strength', label: 'STRENGTH FOCUS' },
                        { value: 'endurance', label: 'ENDURANCE FOCUS' },
                    ]}
                />
                <SelectField 
                    label="Gender Matrix" 
                    value={formData.gender || ''} 
                    onChange={(v) => setFormData({...formData, gender: v})}
                    options={[
                        { value: 'male', label: 'MALE' },
                        { value: 'female', label: 'FEMALE' },
                        { value: 'other', label: 'OTHER' },
                    ]}
                />
                <InputField 
                    label="Biological Age" 
                    type="number"
                    value={formData.age || ''} 
                    onChange={(v) => setFormData({...formData, age: Number(v)})}
                />
                <InputField 
                    label="System Mass (KG)" 
                    type="number"
                    value={formData.weightKg || ''} 
                    onChange={(v) => setFormData({...formData, weightKg: Number(v)})}
                />
                <InputField 
                    label="Stature Elevation (CM)" 
                    type="number"
                    value={formData.heightCm || ''} 
                    onChange={(v) => setFormData({...formData, heightCm: Number(v)})}
                />
                <SelectField 
                    label="Mechanical Output" 
                    value={formData.activityLevel || ''} 
                    onChange={(v) => setFormData({...formData, activityLevel: v as any})}
                    options={[
                        { value: 'sedentary', label: 'SEDENTARY' },
                        { value: 'light', label: 'LIGHTLY ACTIVE' },
                        { value: 'moderate', label: 'MODERATELY ACTIVE' },
                        { value: 'active', label: 'VERY ACTIVE' },
                        { value: 'very_active', label: 'ELITE ATHLETE' },
                    ]}
                />
                <SelectField 
                    label="Tactical Experience" 
                    value={formData.experienceLevel || ''} 
                    onChange={(v) => setFormData({...formData, experienceLevel: v as any})}
                    options={[
                        { value: 'beginner', label: 'BEGINNER' },
                        { value: 'intermediate', label: 'INTERMEDIATE' },
                        { value: 'advanced', label: 'ADVANCED' },
                    ]}
                />
                <SelectField 
                    label="Inventory Specification" 
                    value={formData.equipmentAvailable || ''} 
                    onChange={(v) => setFormData({...formData, equipmentAvailable: v})}
                    options={[
                        { value: 'full_gym', label: 'FULL GYM' },
                        { value: 'home_gym', label: 'HOME GYM (DUMBBELLS/BARBELLS)' },
                        { value: 'basic_home', label: 'BASIC HOME (DUMBBELLS/BANDS)' },
                        { value: 'bodyweight', label: 'BODYWEIGHT ONLY' },
                    ]}
                />
                <InputField 
                    label="Daily Energy Limit (KCAL)" 
                    type="number"
                    value={formData.targetDailyCalories || ''} 
                    onChange={(v) => setFormData({...formData, targetDailyCalories: Number(v)})}
                />
                <InputField 
                    label="Hydration Volume (ML)" 
                    type="number"
                    value={formData.targetDailyHydrationMl || ''} 
                    onChange={(v) => setFormData({...formData, targetDailyHydrationMl: Number(v)})}
                />
              </div>
            </div>

            <div className="pt-10 border-t border-white/5 flex flex-col sm:flex-row justify-end gap-8">
              <button 
                type="button"
                onClick={() => setFormData(userProfile)}
                className="px-6 py-4 text-[10px] font-black text-forge-gray hover:text-white transition-all uppercase tracking-[0.4em] italic hover:glow-text-white"
              >
                Reset Module
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="wine-gradient hover:brightness-125 text-white font-black px-12 py-4 rounded-xl italic tracking-[0.4em] uppercase text-[10px] transition-all shadow-2xl flex items-center justify-center gap-4 disabled:opacity-50 glow-border group"
              >
                {isSaving ? (
                    <Loader2 size={18} className="animate-spin" />
                ) : (
                    <Zap size={18} className="group-hover:rotate-12 transition-transform" fill="currentColor" />
                )}
                {needsOnboarding ? 'Initialize Identity' : 'Commit Updates'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text" }: any) {
    return (
        <div className="space-y-3 group">
            <label className="text-[9px] font-black text-forge-gray uppercase tracking-[0.4em] ml-2 opacity-30 group-focus-within:opacity-100 group-focus-within:text-forge-wine-light transition-all flex items-center gap-2">
                <ChevronRight size={8} className="opacity-0 group-focus-within:opacity-100 transition-opacity" />
                {label}
            </label>
            <input 
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full glass-panel border-white/5 px-6 py-4 rounded-xl text-white font-black tracking-tight focus:border-forge-wine/40 outline-none transition-all shadow-inner text-base uppercase italic placeholder:opacity-5"
            />
        </div>
    );
}

function SelectField({ label, value, onChange, options }: any) {
    return (
        <div className="space-y-3 group">
            <label className="text-[9px] font-black text-forge-gray uppercase tracking-[0.4em] ml-2 opacity-30 group-focus-within:opacity-100 group-focus-within:text-forge-wine-light transition-all flex items-center gap-2">
                <ChevronRight size={8} className="opacity-0 group-focus-within:opacity-100 transition-opacity" />
                {label}
            </label>
            <div className="relative">
                <select 
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full glass-panel border-white/5 px-6 py-4 rounded-xl text-white font-black tracking-tight focus:border-forge-wine/40 outline-none transition-all appearance-none shadow-inner text-base uppercase italic"
                >
                    <option value="" disabled className="bg-forge-black text-white">SELECT PARAMETER</option>
                    {options.map((opt: any) => (
                        <option key={opt.value} value={opt.value} className="bg-forge-black text-white">{opt.label}</option>
                    ))}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-hover:opacity-100 transition-opacity">
                    <ChevronRight size={16} className="rotate-90 text-forge-wine-light" />
                </div>
            </div>
        </div>
    );
}
