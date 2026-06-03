import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Plus, 
  Dumbbell, 
  Clock, 
  Flame, 
  ChevronRight,
  Sparkles,
  Zap,
  Target,
  Trophy,
  History,
  Loader2,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { WorkoutLog, UserProfile, WorkoutExercise } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';

interface WorkoutPlannerProps {
  userProfile: UserProfile;
}

export function WorkoutPlanner({ userProfile }: WorkoutPlannerProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'active' | 'history'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [targetFocus, setTargetFocus] = useState('Chest & Triceps');
  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);
  const [history, setHistory] = useState<WorkoutLog[]>([]);
  const [isWorkoutStarted, setIsWorkoutStarted] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<number>>(new Set());
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null);
  const [currentSet, setCurrentSet] = useState(1);
  const [isResting, setIsResting] = useState(false);
  const [restTimeLeft, setRestTimeLeft] = useState(0);

  useEffect(() => {
    let timer: any;
    if (isWorkoutStarted) {
      timer = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isWorkoutStarted]);

  useEffect(() => {
    let restTimer: any;
    if (isResting && restTimeLeft > 0) {
      restTimer = setInterval(() => {
        setRestTimeLeft(prev => {
          if (prev <= 1) {
            setIsResting(false);
            setCurrentSet(s => s + 1);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(restTimer);
  }, [isResting, restTimeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleExercise = (idx: number) => {
    if (completedExercises.has(idx)) {
      setCompletedExercises(prev => {
        const next = new Set(prev);
        next.delete(idx);
        return next;
      });
    } else {
      setCompletedExercises(prev => new Set(prev).add(idx));
    }
  };

  const startExercise = (idx: number) => {
    setActiveExerciseIndex(idx);
    setCurrentSet(1);
    setIsResting(false);
  };

  const finishSet = (idx: number) => {
    const ex = generatedWorkout.exercises[idx];
    if (currentSet < (ex.sets || 1)) {
      setIsResting(true);
      // Parse rest time (e.g., "60s" or "1m")
      let restValue = 60;
      if (ex.rest) {
        const match = ex.rest.match(/(\d+)/);
        if (match) {
          restValue = parseInt(match[1]);
          if (ex.rest.toLowerCase().includes('m')) restValue *= 60;
        }
      }
      setRestTimeLeft(restValue);
    } else {
      toggleExercise(idx);
      setActiveExerciseIndex(null);
    }
  };

  useEffect(() => {
    const q = query(
      collection(db, 'workout_logs'),
      where('userId', '==', userProfile.userId),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WorkoutLog[];
      setHistory(logs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'workout_logs');
    });

    return () => unsubscribe();
  }, [userProfile.userId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorHeader(null);
    try {
      const response = await fetch('/api/workouts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal: userProfile.goal,
          experience: userProfile.experienceLevel || 'Intermediate',
          equipment: userProfile.equipmentAvailable || 'Full Gym',
          targetFocus
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate workout');
      }
      const data = await response.json();
      setGeneratedWorkout(data);
      setActiveTab('active');
    } catch (error: any) {
      console.error(error);
      const msg = error.message?.includes("503") || error.message?.includes("UNAVAILABLE")
        ? "The coach is currently busy with other athletes. Please try again in 1 second."
        : "Neural link disruption. Failed to generate your workout plan.";
      setErrorHeader(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveProtocol = async () => {
    if (!generatedWorkout) return;
    try {
      await addDoc(collection(db, 'workout_logs'), {
        userId: userProfile.userId,
        date: new Date().toISOString(),
        routineName: generatedWorkout.routineName,
        exercises: generatedWorkout.exercises,
        notes: `Focus: ${targetFocus}${isWorkoutStarted ? ` • Duration: ${formatTime(sessionTime)}` : ''}`
      });
      setIsWorkoutStarted(false);
      setSessionTime(0);
      setCompletedExercises(new Set());
      setActiveTab('history');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'workout_logs');
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex gap-4 p-1.5 glass-panel rounded-2xl w-fit relative z-30 border-white/5 mx-auto lg:mx-0">
        <button 
          onClick={() => setActiveTab('generate')}
          className={cn("px-8 py-3 text-[10px] font-black uppercase tracking-[0.4em] transition-all rounded-xl italic", activeTab === 'generate' ? "wine-gradient text-white shadow-2xl glow-border" : "text-forge-gray hover:text-white")}
        >
          CREATE SESSION
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={cn("px-8 py-3 text-[10px] font-black uppercase tracking-[0.4em] transition-all rounded-xl italic", activeTab === 'history' ? "wine-gradient text-white shadow-2xl glow-border" : "text-forge-gray hover:text-white")}
        >
          WORKOUT LOGS
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'generate' && (
          <motion.div 
            key="generate"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-8 space-y-10">
              <div className="glass-panel p-10 rounded-[2.5rem] space-y-10 shadow-2xl relative overflow-hidden border-white/[0.03]">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-forge-wine/10 blur-[80px] -z-10 rounded-full opacity-50"></div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-[2px] wine-gradient rounded-full"></div>
                    <h3 className="text-[10px] uppercase tracking-[0.6em] font-black text-forge-gray opacity-40 italic">WORKOUT PLAN // BUILDER</h3>
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter text-white italic uppercase glow-text-white leading-tight">WORKOUT <br/><span className="text-forge-wine-light">PLAN</span></h3>
                  <p className="text-forge-gray font-black text-[10px] max-w-sm leading-relaxed opacity-40 italic tracking-widest uppercase">Calibrate tactical parameters for automated plan generation.</p>
                  
                  {errorHeader && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="bg-forge-crimson/10 border border-forge-crimson/20 p-4 rounded-xl text-forge-crimson text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-3 mt-4 italic shadow-2xl"
                    >
                      <Zap size={14} className="fill-current animate-pulse" />
                      {errorHeader}
                    </motion.div>
                  )}
                </div>
                
                <div className="space-y-10">
                  <div className="space-y-4 relative group">
                    <label className="text-[10px] font-black text-forge-gray uppercase tracking-[0.4em] block pl-2 opacity-30 group-focus-within:opacity-100 transition-opacity italic">Tactical Objective Focus</label>
                    <input 
                      value={targetFocus}
                      onChange={(e) => setTargetFocus(e.target.value)}
                      placeholder="e.g. Anterior Chain Overload"
                      className="w-full glass-panel border-white/5 text-white px-8 py-6 rounded-2xl focus:outline-none focus:border-forge-wine/40 transition-all font-black tracking-tighter text-2xl placeholder:opacity-10 italic uppercase shadow-inner"
                    />
                    <div className="absolute bottom-0 left-8 right-8 h-[2px] wine-gradient scale-x-0 group-focus-within:scale-x-100 transition-all duration-700 origin-left"></div>
                  </div>
                  
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full wine-gradient text-white font-black py-6 rounded-xl tracking-[0.6em] uppercase text-[11px] hover:brightness-125 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-6 shadow-2xl glow-border relative overflow-hidden group italic"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 size={20} className="animate-spin text-white" />
                        <span className="animate-pulse tracking-widest">Accessing Neural Grid...</span>
                      </>
                    ) : (
                      <>
                        CREATE WORKOUT SESSION
                        <Zap size={18} strokeWidth={3} fill="currentColor" className="rotate-12 group-hover:scale-125 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <HighlightCard 
                  title="Hypertrophy Calibration" 
                  desc="Neural-load balancing optimized for triggers." 
                  metric="9.0 RPE"
                />
                <HighlightCard 
                  title="CN Stability" 
                  desc="Dynamic rest intervals calculated for phases." 
                  metric="Auto-Rest"
                />
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <div className="glass-panel p-8 rounded-[2rem] h-fit space-y-8 border-white/[0.03] relative overflow-hidden group shadow-2xl">
                <h4 className="text-[10px] font-black text-white uppercase tracking-[0.5em] border-b border-white/5 pb-6 italic glow-text-white">Profile Synthesis</h4>
                <div className="space-y-6 relative z-10">
                  <StatusRow label="Trajectory" value={userProfile.goal} />
                  <StatusRow label="Tactical Grade" value={userProfile.experienceLevel || 'INTERMEDIATE'} />
                  <StatusRow label="Hardware" value={userProfile.equipmentAvailable || 'FULL GYM'} />
                  <StatusRow label="Core Link" value="SYNCED" />
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-forge-wine/5 blur-[60px] -z-10 rounded-full group-hover:bg-forge-wine/10 transition-all duration-1000"></div>
              </div>

              <div className="glass-card p-8 rounded-[2rem] border-white/5 hover:border-forge-wine/20 transition-all flex flex-col items-center text-center gap-5 group shadow-2xl">
                 <div className="p-4 rounded-xl glass-panel wine-border-dim group-hover:glow-border transition-all">
                    <Trophy size={32} className="text-forge-wine-light group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" />
                 </div>
                 <h5 className="text-[10px] font-black text-white uppercase tracking-[0.5em] italic glow-text-white">Progression Delta</h5>
                 <p className="text-forge-gray text-[10px] font-black leading-relaxed italic opacity-40 group-hover:opacity-100 transition-opacity uppercase tracking-widest">Optimized for long-term strategic objectives.</p>
              </div>
            </div>
          </motion.div>
        )}        {activeTab === 'active' && generatedWorkout && (
          <motion.div 
            key="active"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-5xl mx-auto space-y-10"
          >
            <div className="glass-panel p-12 rounded-3xl relative shadow-2xl border-white/10">
               <div className="absolute top-0 right-0 px-12 py-5 bg-forge-wine text-white text-[10px] font-black uppercase tracking-[0.6em] italic rounded-bl-3xl shadow-xl glow-border">Deployment Active</div>
               
                <div className="mb-16 flex justify-between items-start">
                 <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-1 w-10 wine-gradient rounded-full"></div>
                      <span className="text-[11px] font-black text-forge-wine-light uppercase tracking-[0.5em]">Session Protocol</span>
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tighter mb-4 italic uppercase glow-text-white">{generatedWorkout.routineName}</h3>
                    <div className="flex flex-wrap gap-6 items-center">
                      <p className="text-forge-gray font-black text-[10px] uppercase tracking-[0.5em] opacity-60">
                        {isWorkoutStarted ? "Bio-Monitoring in Progress" : "Awaiting Ignition Sequence"}
                      </p>
                      {generatedWorkout.weeklySplit && (
                        <span className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase text-forge-wine-light tracking-[0.3em] glow-border">
                          Split: {generatedWorkout.weeklySplit}
                        </span>
                      )}
                    </div>
                 </div>
                 {isWorkoutStarted && (
                   <div className="text-right glass-card p-6 rounded-2xl wine-border">
                     <span className="text-[10px] font-black text-forge-gray uppercase tracking-[0.5em] block mb-2 opacity-50">T-Elapsed</span>
                     <span className="text-4xl font-black text-white tracking-tighter tabular-nums glow-text-white italic">{formatTime(sessionTime)}</span>
                   </div>
                 )}
               </div>                <div className="space-y-4">
                 {generatedWorkout.exercises.map((ex: any, idx: number) => (
                   <motion.div 
                     key={idx} 
                     className={cn(
                       "flex flex-col md:flex-row md:items-center justify-between py-8 glass-card rounded-2xl transition-all px-8 group relative overflow-hidden",
                       completedExercises.has(idx) ? "opacity-30 border-forge-wine/20 bg-forge-wine-deep/10" : "hover:border-forge-wine/40"
                     )}
                   >
                     <div className="flex items-center gap-10 flex-1">
                       <span className={cn(
                         "text-4xl font-black italic transition-all skew-x-[-10deg] hidden sm:block",
                         completedExercises.has(idx) ? "text-forge-wine-deep/40" : "text-white/5 group-hover:text-forge-wine/20"
                       )}>
                         {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                       </span>
                       <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            {completedExercises.has(idx) ? <div className="text-green-500 font-black text-[8px] uppercase tracking-widest bg-green-500/10 px-2 py-0.5 rounded italic">Completed</div> : <div className="text-forge-wine-light font-black text-[8px] uppercase tracking-widest bg-forge-wine/10 px-2 py-0.5 rounded italic">In Progress</div>}
                            <h4 className={cn("text-base font-black tracking-tight uppercase italic", completedExercises.has(idx) ? "text-forge-gray line-through decoration-forge-wine-light/50" : "text-white")}>
                              {ex.name}
                            </h4>
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-2">
                             <p className="text-[10px] text-forge-gray font-bold italic opacity-40 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                                <Info size={12} className="text-forge-wine-light" />
                                {ex.notes}
                             </p>
                             {ex.rest && (
                                 <div className="flex items-center gap-2 px-2 py-0.5 bg-white/5 rounded-lg border border-white/5">
                                    <Clock size={10} className="text-forge-wine-light" />
                                    <span className="text-[8px] font-black text-forge-gray uppercase tracking-widest whitespace-nowrap">Rest: {ex.rest}</span>
                                 </div>
                             )}
                          </div>
                       </div>
                     </div>
 
                     <div className="flex items-center gap-8 mt-6 md:mt-0">
                        <div className="text-right min-w-[100px]">
                            <span className="text-[9px] font-black text-forge-gray uppercase tracking-[0.4em] block mb-2 opacity-40">Load</span>
                            <div className="px-4 py-2 glass-panel rounded-xl border-forge-wine/10 inline-block">
                              <span className="text-lg font-black text-white tracking-tighter uppercase italic">{ex.sets} <span className="text-[10px] text-forge-wine-light mx-0.5">X</span> {ex.reps}</span>
                            </div>
                        </div>
 
                        {isWorkoutStarted && (
                          <div className="flex-shrink-0">
                            {completedExercises.has(idx) ? (
                              <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-500">
                                <Trophy size={16} />
                              </div>
                            ) : activeExerciseIndex === idx ? (
                              <div className="flex flex-col items-center gap-2">
                                {isResting ? (
                                  <div className="flex flex-col items-center">
                                    <span className="text-[8px] font-black text-forge-wine-light uppercase tracking-widest animate-pulse mb-1">Resting...</span>
                                    <div className="w-12 h-12 rounded-xl wine-border flex items-center justify-center bg-forge-wine/10">
                                      <span className="text-lg font-black text-white tabular-nums">{restTimeLeft}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center gap-2">
                                    <span className="text-[8px] font-black text-forge-gray uppercase tracking-widest">Set {currentSet} / {ex.sets}</span>
                                    <button 
                                      onClick={() => finishSet(idx)}
                                      className="px-6 py-2 wine-gradient text-white text-[9px] font-black uppercase tracking-widest rounded-lg shadow-xl glow-border italic"
                                    >
                                      Finish Set
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button 
                                onClick={() => startExercise(idx)}
                                disabled={activeExerciseIndex !== null}
                                className={cn(
                                  "px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-[0.3em] italic transition-all",
                                  activeExerciseIndex === null 
                                    ? "glass-panel border-forge-wine/20 text-white hover:wine-gradient hover:glow-border" 
                                    : "opacity-20 cursor-not-allowed bg-white/5 text-forge-gray"
                                )}
                              >
                                Start
                              </button>
                            )}
                          </div>
                        )}
                     </div>
                   </motion.div>
                 ))}
               </div>
 
 
               {/* Progression and Coaching Notes */}
               {(generatedWorkout.progressionPlan || generatedWorkout.coachingNotes) && (
                 <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-10 pt-16 border-t border-white/5">
                    {generatedWorkout.progressionPlan && (
                      <div className="space-y-6 glass-card p-10 rounded-3xl relative overflow-hidden">
                        <div className="absolute -top-10 -left-10 w-32 h-32 bg-forge-wine/5 blur-3xl rounded-full"></div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.5em] flex items-center gap-4 italic glow-text-white">
                          <Trophy size={18} className="text-amber-500" />
                          Progression Strategy
                        </h4>
                        <p className="text-xs text-forge-gray leading-relaxed font-bold italic opacity-70 group-hover:opacity-100 transition-opacity">{generatedWorkout.progressionPlan}</p>
                      </div>
                    )}
                    {generatedWorkout.coachingNotes && (
                      <div className="space-y-6 glass-card p-10 rounded-3xl relative overflow-hidden">
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-forge-wine/5 blur-3xl rounded-full"></div>
                        <h4 className="text-[11px] font-black text-white uppercase tracking-[0.5em] flex items-center gap-4 italic glow-text-white">
                          <Sparkles size={18} className="text-forge-wine-light" />
                          Neural Directives
                        </h4>
                        <p className="text-xs text-forge-gray leading-relaxed font-bold italic opacity-70 group-hover:opacity-100 transition-opacity">{generatedWorkout.coachingNotes}</p>
                      </div>
                    )}
                 </div>
               )}
 
               <div className="mt-12 flex gap-6">
                 <button 
                  onClick={handleSaveProtocol}
                  className="flex-1 glass-panel border-white/5 hover:border-white/20 text-forge-gray hover:text-white font-black py-4 rounded-xl uppercase text-[10px] tracking-[0.4em] transition-all hover:scale-[1.01] active:scale-[0.98] shadow-2xl italic group"
                 >
                   {isWorkoutStarted ? "Archive Session" : "Clear Session"}
                   <ChevronRight size={14} className="inline ml-2 group-hover:translate-x-1 transition-transform" />
                 </button>
                 {!isWorkoutStarted ? (
                   <button 
                     onClick={() => setIsWorkoutStarted(true)}
                     className="flex-1 wine-gradient text-white font-black py-4 rounded-xl tracking-[0.4em] uppercase text-[10px] flex items-center justify-center gap-4 transition-all hover:brightness-125 hover:scale-[1.01] active:scale-[0.98] shadow-2xl glow-border italic"
                   >
                     <Play size={18} strokeWidth={3} fill="currentColor" />
                     START SESSION
                   </button>
                 ) : (
                   <button 
                     onClick={handleSaveProtocol}
                     className="flex-1 wine-gradient text-white font-black py-4 rounded-xl tracking-[0.4em] uppercase text-[10px] flex items-center justify-center gap-4 transition-all hover:brightness-125 hover:scale-[1.01] active:scale-[0.98] shadow-2xl glow-border italic"
                   >
                     COMPLETE SESSION
                   </button>
                 )}
               </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div 
            key="history"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            {history.length > 0 ? history.map((log) => (
              <HistoryCard 
                key={log.id}
                title={log.routineName} 
                date={new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }).toUpperCase()} 
                metric="SYNCHRONIZED" 
                focus={log.notes?.split(': ')[1] || 'GENERAL'} 
              />
            )) : (
              <div className="col-span-full py-40 text-center glass-panel rounded-3xl border-dashed border-white/10 group">
                <History className="mx-auto mb-8 text-forge-wine/20 group-hover:text-forge-wine/40 transition-colors group-hover:rotate-[-10deg] duration-500" size={64} strokeWidth={1} />
                <p className="text-forge-wine-light font-black uppercase tracking-[0.8em] text-[12px] italic glow-text-wine">Log Database Empty</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HighlightCard({ title, desc, metric }: any) {
  return (
    <div className="glass-card p-8 rounded-[2rem] space-y-4 group transition-all duration-500 relative overflow-hidden border-white/5">
      <div className="flex justify-between items-start relative z-10">
        <h4 className="text-[9px] font-black tracking-[0.3em] text-white uppercase italic glow-text-white opacity-60 group-hover:opacity-100 transition-opacity">{title}</h4>
        <span className="text-[8px] font-black text-forge-wine-light border border-forge-wine/30 px-3 py-1 rounded-lg bg-forge-wine/5 glow-border">{metric}</span>
      </div>
      <p className="text-[11px] text-forge-gray leading-relaxed font-bold italic opacity-40 group-hover:opacity-80 transition-opacity relative z-10">{desc}</p>
    </div>
  );
}

function StatusRow({ label, value }: any) {
  return (
    <div className="flex items-center justify-between group py-3 border-b border-white/5 last:border-0 hover:bg-white/5 px-2 -mx-2 rounded-lg transition-colors">
      <span className="text-[9px] font-black text-forge-gray uppercase tracking-[0.4em] group-hover:text-forge-wine-light transition-colors">{label}</span>
      <span className="text-[10px] font-black text-white tracking-widest uppercase italic group-hover:glow-text-white transition-all">{value}</span>
    </div>
  );
}

function HistoryCard({ title, date, metric, focus }: any) {
  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.01 }}
      className="glass-card p-10 rounded-[1.8rem] hover:border-forge-wine/30 group flex flex-col justify-between h-[280px] cursor-pointer shadow-xl relative overflow-hidden border-white/5"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-forge-wine/5 blur-3xl rounded-full"></div>
      <div className="flex justify-between items-start relative z-10">
        <div className="w-12 h-12 border border-white/10 rounded-xl flex items-center justify-center group-hover:border-forge-wine/40 transition-all bg-white/5 glow-border group-hover:bg-forge-wine/10">
          <History className="text-forge-gray group-hover:text-forge-wine-light transition-colors" size={20} strokeWidth={2} />
        </div>
        <div className="px-3 py-1.5 bg-black/40 rounded-lg border border-white/5">
           <span className="text-[8px] font-black text-forge-wine-light uppercase tracking-[0.4em] italic">{focus}</span>
        </div>
      </div>
      <div className="relative z-10 space-y-3">
        <h4 className="text-xl font-black text-white tracking-tighter uppercase italic glow-text-white group-hover:translate-x-1 transition-transform duration-500 leading-tight">{title}</h4>
        <div className="flex items-center gap-3">
           <div className="h-1 w-6 wine-gradient rounded-full"></div>
           <p className="text-[9px] text-forge-gray font-black uppercase tracking-[0.3em] opacity-40">{date} <span className="mx-2 opacity-20">|</span> <span className="text-forge-wine-light">{metric}</span></p>
        </div>
      </div>
    </motion.div>
  );
}

