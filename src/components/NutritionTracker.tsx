import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Camera, 
  Sparkles, 
  ChevronRight,
  UtensilsCrossed,
  Droplets,
  Zap,
  Clock,
  Flame,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn, formatCalories } from '../lib/utils';
import { NutritionLog, UserProfile } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';

interface NutritionTrackerProps {
  userProfile: UserProfile;
}

export function NutritionTracker({ userProfile }: NutritionTrackerProps) {
  const [mealInput, setMealInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorHeader, setErrorHeader] = useState<string | null>(null);
  const [logs, setLogs] = useState<NutritionLog[]>([]);
  const [showArchive, setShowArchive] = useState(false);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const q = query(
      collection(db, 'nutrition_logs'),
      where('userId', '==', userProfile.userId),
      showArchive ? where('date', '<', today) : where('date', '==', today),
      orderBy(showArchive ? 'date' : 'timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nutritionLogs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as NutritionLog[];
      setLogs(nutritionLogs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'nutrition_logs');
    });

    return () => unsubscribe();
  }, [userProfile.userId]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mealInput.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setErrorHeader(null);
    try {
      const response = await fetch('/api/nutrition/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mealDescription: mealInput, userProfile })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Meal analysis failed');
      }
      const data = await response.json();
      
      const newLogData = {
        userId: userProfile.userId,
        date: new Date().toISOString().split('T')[0],
        mealName: data.mealName,
        calories: Math.round(data.calories),
        protein: Math.round(data.protein),
        carbs: Math.round(data.carbs),
        fat: Math.round(data.fat),
        healthScore: data.healthScore,
        healthReason: data.healthReason,
        coachingInsight: data.coachingInsight,
        improvementSuggestion: data.improvementSuggestion,
        timestamp: new Date().toISOString()
      };

      await addDoc(collection(db, 'nutrition_logs'), newLogData);
      setMealInput('');
    } catch (error: any) {
      console.error(error);
      const msg = error.message?.includes("503") || error.message?.includes("UNAVAILABLE")
        ? "Metabolic grid overloaded. Re-attempt decryption in a moment."
        : "Signal disruption. Bio-fuel analysis protocol failed.";
      setErrorHeader(msg);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const totalCals = logs.reduce((acc, curr) => acc + (curr.calories || 0), 0);
  const targetCals = userProfile.targetDailyCalories || 2400;

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Column */}
        <div className="lg:col-span-8 space-y-10">
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex justify-between items-end px-2">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-forge-wine-light rounded-full"></div>
                  <h3 className="text-[9px] uppercase tracking-[0.4em] font-black text-forge-gray opacity-60">Synthesis Module</h3>
                </div>
                <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter glow-text-white">Bio-Fuel Analysis</h2>
                {errorHeader && (
                  <p className="text-forge-crimson text-[9px] font-black uppercase tracking-[0.4em] flex items-center gap-2 mt-3">
                    <Zap size={12} className="fill-current" />
                    {errorHeader}
                  </p>
                )}
              </div>
              <div className="flex gap-3 text-[8px] items-center font-black text-white uppercase tracking-[0.3em] mb-1 px-4 py-1.5 glass-panel rounded-full border-forge-wine/20">
                <Sparkles size={10} className="text-forge-wine-light" />
                Neural Grid Linked
              </div>
            </div>
            
            <form onSubmit={handleAnalyze} className="space-y-6">
              <div className="relative group perspective-1000">
                <div className="absolute -inset-1 bg-gradient-to-r from-forge-wine/20 to-forge-wine-deep/20 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-focus-within:opacity-100"></div>
                <textarea
                  value={mealInput}
                  onChange={(e) => setMealInput(e.target.value)}
                  placeholder="200g Grilled Wagyu, Seaweed Salad..."
                  className="w-full glass-panel border-white/5 text-white p-8 rounded-[1.5rem] focus:outline-none focus:border-forge-wine/40 transition-all min-h-[160px] resize-none font-medium tracking-tight text-lg placeholder:opacity-10 placeholder:italic relative z-10 italic"
                />
                <div className="absolute right-8 bottom-8 flex gap-6 text-forge-gray relative z-20">
                  <Camera size={20} strokeWidth={1} className="hover:text-forge-wine-light cursor-pointer transition-all hover:scale-110 active:scale-95" />
                </div>
              </div>
              <button 
                type="submit"
                disabled={isAnalyzing || !mealInput.trim()}
                className="w-full wine-gradient text-white font-black py-5 rounded-xl tracking-[0.4em] uppercase text-[10px] hover:brightness-125 hover:scale-[1.01] active:scale-[0.98] transition-all disabled:opacity-20 flex items-center justify-center gap-4 shadow-2xl glow-border relative overflow-hidden italic"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={20} className="animate-spin text-white" />
                    <span className="animate-pulse tracking-widest">Analyzing Bio-Markers...</span>
                  </>
                ) : (
                  <>
                    SCAN THE FOOD NUTRIENTS
                    <Zap size={16} strokeWidth={3} fill="currentColor" className="rotate-12" />
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* History */}
          <div className="space-y-6">
            <div className="flex items-center justify-between opacity-40 px-2 group">
               <div className="flex items-center gap-4 flex-1">
                 <div className="h-px flex-1 bg-white/10 group-hover:bg-forge-wine/20 transition-all"></div>
                 <h3 className="text-[9px] uppercase tracking-[0.6em] font-black text-forge-gray italic shrink-0">
                   {showArchive ? "Historical Ingestion Log" : "Today's Ingestion Log"}
                 </h3>
               </div>
               <button 
                onClick={() => setShowArchive(!showArchive)}
                className="ml-6 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] px-4 py-1.5 glass-panel rounded-full hover:wine-border transition-all text-white border-white/5"
               >
                 <Clock size={10} className={cn(showArchive ? "text-forge-wine-light" : "text-forge-gray")} />
                 {showArchive ? "VIEW TODAY" : "VIEW ARCHIVE"}
               </button>
            </div>
            <div className="space-y-6">
              {logs.length > 0 ? logs.map((log) => (
                <motion.div 
                  key={log.id} 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-8 rounded-[2rem] hover:border-forge-wine/30 transition-all group relative overflow-hidden backdrop-blur-3xl shadow-2xl border-white/5"
                >
                  <div className="flex items-center justify-between mb-8 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-base font-black italic shadow-2xl border transition-all tilt-hover",
                        (log.healthScore || 0) >= 8 ? "bg-green-500/10 text-green-400 border-green-500/20 glow-border" :
                        (log.healthScore || 0) >= 5 ? "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.2)]" :
                        "bg-forge-crimson/10 text-forge-crimson border-forge-crimson/20 shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                      )}>
                        {log.healthScore || "-"}
                      </div>
                      <div>
                        <h4 className="text-xl font-black tracking-tighter text-white uppercase italic glow-text-white transition-all group-hover:translate-x-1">{log.mealName}</h4>
                        <p className="text-[9px] font-black text-forge-gray uppercase tracking-[0.3em] mt-1.5 opacity-50 italic">
                          {showArchive ? log.date : new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} <span className="mx-2">|</span> {log.healthReason || "Data Validated"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right glass-card px-6 py-3 rounded-xl wine-border">
                      <div className="text-2xl font-black tracking-tighter text-white italic glow-text-white">
                        {log.calories}
                        <span className="text-[8px] text-forge-gray uppercase font-black tracking-[0.3em] ml-1.5 italic opacity-40">Kcal</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-8 relative z-10">
                    <MacroTag label="Protein" value={log.protein || 0} unit="G" active />
                    <MacroTag label="Carbs" value={log.carbs || 0} unit="G" />
                    <MacroTag label="Fat" value={log.fat || 0} unit="G" />
                  </div>

                  {(log.coachingInsight || log.improvementSuggestion) && (
                    <div className="bg-white/5 border border-white/5 rounded-[1.5rem] p-6 space-y-4 relative overflow-hidden group/audit">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-forge-wine/10 blur-xl opacity-0 group-hover/audit:opacity-100 transition-opacity"></div>
                      {log.coachingInsight && (
                        <div className="flex gap-4 relative z-10">
                          <Sparkles size={16} className="text-forge-wine-light mt-0.5 shrink-0 animate-pulse" />
                          <p className="text-[12px] font-bold text-forge-gray leading-relaxed italic opacity-80">"{log.coachingInsight}"</p>
                        </div>
                      )}
                      {log.improvementSuggestion && (
                        <div className="flex gap-4 border-t border-white/5 pt-4 relative z-10">
                          <Zap size={16} className="text-amber-500 mt-0.5 shrink-0 fill-current" />
                          <p className="text-[9px] font-black text-white uppercase tracking-[0.2em] italic">Optimization: <span className="text-forge-wine-light font-black ml-2 animate-glow">{'>>'} {log.improvementSuggestion}</span></p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Aesthetic backgrounds */}
                  <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-forge-wine/5 blur-3xl -z-10 rounded-full group-hover:bg-forge-wine/10 transition-all animate-float"></div>
                </motion.div>
              )) : (
                <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-white/5 rounded-[3rem] group">
                   <UtensilsCrossed size={64} strokeWidth={1} className="text-forge-wine/20 mb-8 animate-pulse group-hover:rotate-12 transition-transform" />
                   <p className="text-forge-wine-light font-black uppercase tracking-[0.8em] text-[12px] italic glow-text-wine">Awaiting Nutritional Ingestion</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="lg:col-span-4 space-y-8">
          <div className="p-8 glass-panel rounded-[2rem] relative overflow-hidden shadow-2xl border-white/5 group perspective-1000">
             <div className="absolute top-0 right-0 w-32 h-32 bg-forge-wine/5 blur-3xl -z-10 rounded-full"></div>
             <div className="space-y-10 relative z-10">
               <div>
                 <div className="flex justify-between items-center mb-8">
                   <span className="text-[9px] uppercase tracking-[0.5em] font-black text-white italic glow-text-white">Bio-Fuel Compliance</span>
                   <span className="text-[8px] font-black text-forge-gray tracking-[0.2em] uppercase opacity-40">{totalCals} <span className="mx-1 opacity-20">/</span> {targetCals}</span>
                 </div>
                 <div className="flex flex-col gap-8">
                    <MacroMinimal label="Protein Intake" current={logs.reduce((a, b) => a + (b.protein || 0), 0)} target={userProfile.targetDailyProtein || 180} color="wine-gradient" />
                    <MacroMinimal label="Carbohydrate Intake" current={logs.reduce((a, b) => a + (b.carbs || 0), 0)} target={userProfile.targetDailyCarbs || 250} color="bg-white/80" />
                    <MacroMinimal label="Fat Intake" current={logs.reduce((a, b) => a + (b.fat || 0), 0)} target={userProfile.targetDailyFat || 70} color="bg-forge-gray/30" />
                 </div>
               </div>

               <div className="pt-10 border-t border-white/5 space-y-4 text-center">
                  <p className="text-[9px] uppercase tracking-[0.5em] font-black text-forge-gray opacity-40 italic">System Allowance</p>
                  <p className="text-4xl font-black tracking-tighter text-white italic glow-text-white group-hover:scale-105 transition-transform duration-700">
                    {Math.max(0, targetCals - totalCals)}
                    <span className="text-[10px] text-forge-wine-light font-black ml-2 uppercase tracking-[0.2em] not-italic opacity-60">R-Cal</span>
                  </p>
               </div>
             </div>
          </div>

          <div className="p-8 glass-card rounded-[2rem] space-y-6 border-white/5 hover:border-forge-wine/20 transition-all relative overflow-hidden group">
            <div className="flex items-center gap-4 text-white group-hover:glow-text-white transition-all relative z-10">
              <Sparkles size={16} strokeWidth={2} className="text-forge-wine-light animate-float" />
              <span className="text-[10px] uppercase tracking-[0.4em] font-black italic">Strategic Feed</span>
            </div>
            <p className="text-[12px] text-forge-gray leading-relaxed font-bold italic opacity-60 group-hover:opacity-100 transition-opacity relative z-10">
              Analysis indicates a high-fidelity macronutrient alignment. Protocol active.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MacroTag({ label, value, unit, active }: { label: string, value: number, unit: string, active?: boolean }) {
  return (
    <div className={cn(
      "glass-panel rounded-2xl px-6 py-5 text-center transition-all duration-700 border-white/[0.03] hover:border-forge-wine/30 group/macro relative overflow-hidden",
      active && "wine-border bg-forge-wine/5 shadow-[0_15px_40px_rgba(122,17,40,0.1)] scale-[1.03]"
    )}>
      <div className="absolute inset-0 bg-forge-wine/5 opacity-0 group-hover/macro:opacity-100 transition-opacity"></div>
      <div className="text-[9px] uppercase tracking-[0.4em] font-black text-forge-gray mb-3 opacity-40 italic group-hover/macro:opacity-100 transition-opacity relative z-10">{label}</div>
      <div className="text-2xl font-black tracking-tighter text-white italic glow-text-white relative z-10">
        {value}
        <span className="text-[10px] font-black ml-1.5 text-forge-gray opacity-30 italic uppercase tracking-[0.1em]">{unit}</span>
      </div>
    </div>
  );
}

function MacroMinimal({ label, current, target, color }: any) {
  const safeCurrent = isNaN(Number(current)) ? 0 : Number(current);
  const safeTarget = Math.max(isNaN(Number(target)) ? 1 : Number(target), 1);
  const percentage = Math.min((safeCurrent / safeTarget) * 100, 100);
  return (
    <div className="space-y-3 group/minimal">
      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-forge-gray opacity-60 group-hover/minimal:opacity-100 transition-opacity">
        <span>{label}</span>
        <span className="text-white italic">{safeCurrent}G <span className="font-black text-forge-gray opacity-20 ml-1">/ {target || 0}G</span></span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative shadow-2xl">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.2 }}
          className={cn("h-full transition-all group-hover/minimal:brightness-125 rounded-full", color)}
        />
      </div>
    </div>
  );
}


