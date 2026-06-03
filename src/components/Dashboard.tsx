import React, { useState, useEffect } from 'react';
import { 
  Flame, 
  Droplet, 
  Activity, 
  Timer,
  ArrowUpRight,
  TrendingDown,
  ChevronRight,
  Utensils,
  Dumbbell as DumbbellIcon,
  LineChart as LineChartIcon,
  Zap,
  Clock,
  Sparkles,
  Info,
  Target
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion } from 'framer-motion';
import { UserProfile, WeightLog, NutritionLog, WorkoutLog } from '../types';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useFirebase } from '../contexts/FirebaseContext';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { format, parseISO } from 'date-fns';

interface DashboardProps {
  userProfile: UserProfile;
}

export function Dashboard({ userProfile }: DashboardProps) {
  const { updateProfile } = useFirebase();
  const [weightData, setWeightData] = useState<any[]>([]);
  const [todayNutrition, setTodayNutrition] = useState<{ calories: number, protein: number, carbs: number, fat: number }>({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  const [lastWeight, setLastWeight] = useState<number>(userProfile.weightKg || 0);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // 1. Fetch Weight Trend
    const weightQ = query(
      collection(db, 'weight_logs'),
      where('userId', '==', userProfile.userId),
      orderBy('date', 'desc'),
      limit(7)
    );
    const unsubscribeWeight = onSnapshot(weightQ, (snapshot) => {
      const logs = snapshot.docs.map(doc => doc.data() as WeightLog);
      if (logs.length > 0) setLastWeight(logs[0].weightKg);
      setWeightData(logs.map(log => ({
        name: format(parseISO(log.date), 'EEE'),
        weight: log.weightKg
      })).reverse());
    });

    // 2. Fetch Today's Nutrition
    const nutritionQ = query(
      collection(db, 'nutrition_logs'),
      where('userId', '==', userProfile.userId),
      where('date', '==', today)
    );
    const unsubscribeNutrition = onSnapshot(nutritionQ, (snapshot) => {
      const logs = snapshot.docs.map(doc => doc.data() as NutritionLog);
      const totals = logs.reduce((acc, curr) => ({
        calories: acc.calories + (curr.calories || 0),
        protein: acc.protein + (curr.protein || 0),
        carbs: acc.carbs + (curr.carbs || 0),
        fat: acc.fat + (curr.fat || 0)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
      setTodayNutrition(totals);
    });

    // 3. Recent Activities (Workouts and Nutrition combined)
    const workoutQ = query(
      collection(db, 'workout_logs'),
      where('userId', '==', userProfile.userId),
      orderBy('date', 'desc'),
      limit(5)
    );
    const nutritionQ_recent = query(
      collection(db, 'nutrition_logs'),
      where('userId', '==', userProfile.userId),
      orderBy('date', 'desc'),
      limit(5)
    );

    const unsubscribeWorkout = onSnapshot(workoutQ, (workoutSnap) => {
      onSnapshot(nutritionQ_recent, (nutritionSnap) => {
        const workouts = workoutSnap.docs.map(doc => {
          const d = doc.data() as WorkoutLog;
          return {
            type: 'workout',
            title: d.routineName,
            subtitle: `Logged ${d.exercises.length} Exercises`,
            time: format(parseISO(d.date), 'HH:mm'),
            metric: `${d.exercises.length} EX`,
            timestamp: parseISO(d.date).getTime(),
            date: d.date
          };
        });

        const nutrition = nutritionSnap.docs.map(doc => {
          const d = doc.data() as NutritionLog;
          return {
            type: 'nutrition',
            title: d.mealName,
            subtitle: `Consumed ${d.calories} KCAL`,
            time: format(parseISO(d.date), 'HH:mm'),
            metric: `${d.calories} KCAL`,
            timestamp: parseISO(d.date).getTime(),
            date: d.date
          };
        });

        const combined = [...workouts, ...nutrition]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 5);
        
        setRecentActivities(combined);
      });
    });

    return () => {
      unsubscribeWeight();
      unsubscribeNutrition();
      unsubscribeWorkout();
    };
  }, [userProfile.userId]);

  const nutritionDisplayData = [
    { name: 'Protein', value: todayNutrition.protein || 0, target: Math.max(userProfile.targetDailyProtein || 180, 1), color: '#C41E3A' },
    { name: 'Carbohydrates', value: todayNutrition.carbs || 0, target: Math.max(userProfile.targetDailyCarbs || 250, 1), color: 'rgba(255,255,255,0.8)' },
    { name: 'Lipids', value: todayNutrition.fat || 0, target: Math.max(userProfile.targetDailyFat || 70, 1), color: 'rgba(255,255,255,0.3)' },
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Goal Optimization Module */}
      <section className="glass-panel p-8 rounded-[2rem] border-white/5 relative overflow-hidden shadow-2xl group border-l-4 border-l-forge-wine/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-forge-wine/5 blur-[80px] -z-10 opacity-50 group-hover:bg-forge-wine/10 transition-all"></div>
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
          <div className="flex items-center gap-6">
            <div className="p-4 glass-panel rounded-2xl wine-border-dim shadow-2xl bg-forge-wine/5 group-hover:bg-forge-wine/10 transition-all">
              <Target size={24} className="text-forge-wine-light glow-text-wine" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-px bg-forge-wine-light"></div>
                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase glow-text-white">Directive Alignment</h3>
              </div>
              <p className="text-[9px] font-black text-forge-gray uppercase tracking-[0.4em] opacity-40 italic">Current Protocol: <span className="text-forge-wine-light font-black">{userProfile.goal?.toUpperCase() || 'SEARCHING...'}</span></p>
              <div className="flex gap-4 mt-3">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-forge-gray uppercase tracking-widest opacity-30">Calories</span>
                  <span className="text-xs font-black text-white italic">{userProfile.targetDailyCalories || 0}</span>
                </div>
                <div className="flex flex-col border-l border-white/10 pl-4">
                  <span className="text-[8px] font-black text-forge-gray uppercase tracking-widest opacity-30">Protein</span>
                  <span className="text-xs font-black text-white italic">{userProfile.targetDailyProtein || 0}G</span>
                </div>
                <div className="flex flex-col border-l border-white/10 pl-4">
                  <span className="text-[8px] font-black text-forge-gray uppercase tracking-widest opacity-30">Carbs</span>
                  <span className="text-xs font-black text-white italic">{userProfile.targetDailyCarbs || 0}G</span>
                </div>
                <div className="flex flex-col border-l border-white/10 pl-4">
                  <span className="text-[8px] font-black text-forge-gray uppercase tracking-widest opacity-30">Fat</span>
                  <span className="text-xs font-black text-white italic">{userProfile.targetDailyFat || 0}G</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center md:justify-end">
            <button 
              onClick={() => updateProfile({ goal: 'bulking' })}
              className={cn(
                "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] italic transition-all shadow-xl relative overflow-hidden group/btn",
                userProfile.goal === 'bulking' 
                  ? "wine-gradient text-white glow-border scale-105" 
                  : "glass-panel text-forge-gray border-white/5 hover:border-forge-wine/40 hover:text-white"
              )}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              <span className="relative z-10">Initiate Bulking</span>
            </button>
            <button 
              onClick={() => updateProfile({ goal: 'cutting' })}
              className={cn(
                "px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] italic transition-all shadow-xl relative overflow-hidden group/btn",
                userProfile.goal === 'cutting' 
                  ? "wine-gradient text-white glow-border scale-105" 
                  : "glass-panel text-forge-gray border-white/5 hover:border-forge-wine/40 hover:text-white"
              )}
            >
              <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              <span className="relative z-10">Initiate Cutting</span>
            </button>
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Metabolic Energy" 
          value={isNaN(Number(todayNutrition.calories)) ? "0" : (todayNutrition.calories || 0).toLocaleString()} 
          unit="KCAL" 
          trend={`LIMIT: ${userProfile.targetDailyCalories || 2500} KCAL`}
          icon={<Flame size={16} />}
          isSuccess={(todayNutrition.calories || 0) >= (userProfile.targetDailyCalories || 2500)}
        />
        <StatCard 
          label="Protein Intake" 
          value={isNaN(Number(todayNutrition.protein)) ? "0" : (todayNutrition.protein || 0).toString()} 
          unit="G" 
          trend={`REQ: ${userProfile.targetDailyProtein || 180}G`}
          icon={<Activity size={16} />}
          isSuccess={(todayNutrition.protein || 0) >= (userProfile.targetDailyProtein || 180)}
        />
        <StatCard 
          label="Carbohydrate Intake" 
          value={isNaN(Number(todayNutrition.carbs)) ? "0" : (todayNutrition.carbs || 0).toString()} 
          unit="G" 
          trend={`TARGET: ${userProfile.targetDailyCarbs || 250}G`}
          icon={<Zap size={16} />}
          isSuccess={(todayNutrition.carbs || 0) >= (userProfile.targetDailyCarbs || 250)}
        />
        <StatCard 
          label="Biometric Mass" 
          value={isNaN(Number(lastWeight)) ? (userProfile.weightKg || 0).toString() : (lastWeight || 0).toString()} 
          unit="KG" 
          trend="Last Snapshot"
          icon={<LineChartIcon size={16} />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Weight Analysis */}
        <div className="lg:col-span-8 group">
          <div className="glass-panel p-8 rounded-[2rem] border-white/5 hover:border-forge-wine/20 transition-all duration-700 relative overflow-hidden h-full shadow-2xl flex flex-col">
            <div className="flex justify-between items-start mb-8 relative z-10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-6 h-px wine-gradient opacity-60"></div>
                   <h3 className="text-[9px] uppercase tracking-[0.5em] font-black text-forge-wine-light italic opacity-80 glow-text-wine">Biometric Evolution</h3>
                </div>
                <p className="text-xl font-black text-white glow-text-white italic uppercase tracking-tighter">Neural Telemetry Feed</p>
              </div>
              <div className="px-3 py-1.5 glass-panel border-forge-wine/20 rounded-lg text-[8px] font-black text-forge-wine-light uppercase tracking-widest glow-border italic">Live Stream</div>
            </div>
            
            <div className="h-[280px] w-full relative z-10 flex-1">
              {weightData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weightData}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#C41E3A" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#C41E3A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.2)" fontSize={11} fontWeight="900" tickLine={false} axisLine={false} dy={15} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} fontWeight="900" tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} dx={-15} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(13,13,13,0.9)', border: '1px solid rgba(196,30,58,0.4)', borderRadius: '16px', fontSize: '11px', color: '#fff', backdropFilter: 'blur(12px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                      itemStyle={{ color: '#C41E3A', fontWeight: 'bold' }}
                      cursor={{ stroke: 'rgba(196,30,58,0.2)', strokeWidth: 1 }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#C41E3A" 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorWeight)" 
                      dot={{ r: 5, fill: '#C41E3A', strokeWidth: 3, stroke: '#fff' }} 
                      activeDot={{ r: 8, fill: '#fff', stroke: '#C41E3A', strokeWidth: 4, className: 'animate-pulse' }} 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[10px] font-black text-forge-wine-light uppercase tracking-[.5em] italic glow-text-wine">
                   <Activity className="mb-6 animate-pulse text-forge-wine-light opacity-60" size={48} />
                   Establishing Data Integrity
                </div>
              )}
            </div>
            
            {/* Decors */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-forge-wine/5 blur-[100px] -z-10 rounded-full opacity-50"></div>
          </div>
        </div>

        {/* Nutrition Distribution */}
        <div className="lg:col-span-4">
          <div className="glass-panel p-8 rounded-[2rem] h-full flex flex-col relative overflow-hidden group border-white/5">
            <div className="flex items-center gap-3 mb-8">
               <div className="w-6 h-px bg-white/20"></div>
               <h3 className="text-[9px] uppercase tracking-[0.5em] font-black text-forge-gray italic opacity-40">Macro Allocation</h3>
            </div>
            
            <div className="space-y-8 flex-1 relative z-10">
              {nutritionDisplayData.map((macro, idx) => (
                <div key={macro.name} className="group/item">
                  <div className="flex justify-between items-end mb-3">
                    <span className="text-[9px] font-black text-forge-gray uppercase tracking-[0.3em] group-hover/item:text-white transition-colors italic">{macro.name}</span>
                    <p className="text-xl font-black tracking-tighter text-white italic glow-text-white">
                      {macro.value}
                      <span className="text-[9px] text-forge-gray ml-2 font-black uppercase tracking-[0.2em] opacity-30">/ {macro.target}G</span>
                    </p>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative border border-white/5 p-[1px]">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min((macro.value / macro.target) * 100, 100)}%` }}
                      transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.2 * idx }}
                      className="h-full rounded-full transition-all relative overflow-hidden"
                      style={{ 
                        backgroundColor: macro.color,
                        boxShadow: `0 0 15px ${macro.color}40`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full animate-[shimmer_3s_infinite]" />
                    </motion.div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-10 pt-8 border-t border-white/5 relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-1.5 glass-panel rounded-lg wine-border-dim shadow-2xl">
                  <Sparkles size={14} className="text-forge-wine-light glow-text-wine" fill="currentColor" />
                </div>
                <p className="text-[9px] text-white font-black uppercase tracking-[0.4em] italic glow-text-white">Neural Advisor</p>
              </div>
              <p className="text-[11px] text-forge-gray leading-relaxed font-black italic opacity-60">
                {todayNutrition.protein < 100 
                  ? "Anabolic suppression detected. Trigger high-protein ingestion protocol." 
                  : "Physiological setpoint maintained. Homeostasis verified."}
              </p>
            </div>

            {/* Ambient Background Glow */}
            <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-forge-wine/10 blur-[80px] rounded-full group-hover:bg-forge-wine/20 transition-all duration-1000"></div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="space-y-6 animate-in slide-in-from-bottom-5 duration-1000">
        <div className="flex items-center justify-between px-4">
           <div className="flex items-center gap-3">
              <div className="h-1 w-1 rounded-full wine-gradient glow-border"></div>
              <h3 className="text-[9px] uppercase tracking-[0.6em] font-black text-forge-gray italic opacity-40">System Transaction Log</h3>
           </div>
           <button className="text-[8px] font-black text-forge-gray hover:text-white uppercase tracking-[0.3em] italic underline underline-offset-4 transition-all">Export Archive</button>
        </div>
        <div className="lg:border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl backdrop-blur-3xl bg-forge-black/20">
          <div className="divide-y divide-white/[0.02]">
            {recentActivities.length > 0 ? recentActivities.map((activity, idx) => (
              <ActivityItem 
                key={idx}
                title={activity.title} 
                subtitle={activity.subtitle} 
                time={activity.time} 
                metric={activity.metric}
                icon={activity.type === 'workout' ? <DumbbellIcon size={18} className="text-forge-wine-light glow-text-wine" /> : <Utensils size={18} className="text-forge-gray opacity-40" />}
              />
            )) : (
              <div className="py-24 text-center">
                 <div className="w-16 h-16 glass-panel border-white/5 rounded-full mx-auto flex items-center justify-center mb-6 shadow-2xl relative">
                    <div className="absolute inset-0 bg-forge-wine/10 blur-xl animate-pulse"></div>
                    <Activity className="text-forge-wine-light animate-pulse relative z-10" size={32} />
                 </div>
                 <p className="text-[10px] text-forge-wine-light uppercase font-black tracking-[0.5em] italic glow-text-wine">Awaiting Athlete Activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, unit, trend, icon, glow, isSuccess }: any) {
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.01 }}
      className={cn(
        "glass-panel p-6 rounded-[1.8rem] space-y-6 group transition-all duration-700 relative overflow-hidden border-white/5",
        glow && "shadow-[0_0_40px_rgba(122,17,40,0.08)]",
        isSuccess && "border-green-500/20 shadow-[0_0_40px_rgba(34,197,94,0.05)]"
      )}
    >
      <div className="flex justify-between items-start relative z-10">
        <div className={cn(
          "p-3 rounded-xl glass-panel border-white/5 transition-all shadow-xl group-hover:glow-border",
          isSuccess 
            ? "text-green-400 border-green-500/30 bg-green-500/10" 
            : "text-forge-gray group-hover:text-forge-wine-light group-hover:wine-border-dim"
        )}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-[9px] uppercase tracking-[0.4em] font-black text-forge-gray opacity-30 group-hover:opacity-100 transition-opacity italic">{label}</p>
        </div>
      </div>
      <div className="relative z-10">
        <p className="text-3xl font-black tracking-tighter text-white uppercase italic glow-text-white">
          {value}
          <span className="text-[9px] text-forge-gray font-black ml-2 uppercase tracking-[0.3em] opacity-20 italic">{unit}</span>
        </p>
      </div>
      <div className="flex items-center gap-3 relative z-10">
        <div className="h-px flex-1 bg-white/[0.03]"></div>
        <div className="flex items-center gap-2">
            <p className={cn(
              "text-[9px] font-black uppercase tracking-widest italic transition-colors",
              isSuccess ? "text-green-400 glow-text-green" : "text-forge-wine-light glow-text-wine"
            )}>{trend}</p>
            <ChevronRight size={8} className={cn(
              "transition-transform",
              isSuccess ? "text-green-400" : "text-forge-wine-light group-hover:translate-x-1"
            )} />
        </div>
      </div>
      
      {/* Decorative Gradient */}
      <div className="absolute top-0 right-0 w-32 h-32 blur-[50px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        style={{ backgroundColor: isSuccess ? 'rgba(34,197,94,0.05)' : 'rgba(122,17,40,0.05)' }}
      ></div>
    </motion.div>
  );
}

function ActivityItem({ title, subtitle, time, metric, icon }: any) {
  return (
    <motion.div 
      whileHover={{ backgroundColor: 'rgba(122,17,40,0.02)' }}
      className="p-6 flex items-center justify-between group cursor-pointer transition-all border-l-4 border-transparent hover:border-forge-wine-light/50 backdrop-blur-3xl"
    >
      <div className="flex items-center gap-8">
        <div className="w-12 h-12 rounded-xl glass-panel border-white/5 flex items-center justify-center text-forge-gray group-hover:text-white transition-all shadow-xl group-hover:shadow-[0_0_20px_rgba(122,17,40,0.2)]">
          {icon}
        </div>
        <div>
          <h4 className="text-xs font-black tracking-[0.1em] text-white uppercase group-hover:glow-text-white transition-all italic">{title}</h4>
          <p className="text-[10px] text-forge-gray font-black uppercase tracking-[0.2em] mt-2 italic opacity-30 group-hover:opacity-60 transition-opacity">{subtitle}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center gap-3 justify-end">
          <p className="text-lg font-black text-white italic tracking-tighter uppercase glow-text-white">{metric}</p>
          <ArrowUpRight size={14} className="text-forge-wine-light opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0" strokeWidth={3} />
        </div>
        <p className="text-[9px] text-forge-wine-light font-black uppercase tracking-[0.4em] mt-2 opacity-30 italic">{time} UTC</p>
      </div>
    </motion.div>
  );
}

function Dumbbell(props: any) {
  return (
    <svg 
      {...props}
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M14.4 14.4 9.6 9.6"/><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.767a2 2 0 1 1-2.829-2.828l-1.767 1.767a2 2 0 1 1-2.829-2.828l1.767-1.767a2 2 0 1 1-2.829-2.828l1.767-1.767a2 2 0 1 1-2.829-2.828l-1.414 1.414a2 2 0 1 1-2.828-2.828l1.414-1.414a2 2 0 1 1-2.828-2.828a2 2 0 1 1 2.828 2.828l1.414-1.414"/><path d="m15 21 6-6"/><path d="m3 9 6-6"/>
    </svg>
  );
}
