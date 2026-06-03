import React from 'react';
import { 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  Brain, 
  Layout, 
  Activity, 
  Droplets, 
  Dumbbell, 
  MessageSquare,
  ChevronRight,
  TrendingUp,
  Beef,
  Flame,
  Search,
  Plus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useFirebase } from '../contexts/FirebaseContext';
import { cn } from '../lib/utils';

export function Login() {
  const { signIn } = useFirebase();

  return (
    <div className="min-h-screen bg-forge-black text-white selection:bg-forge-wine selection:text-white overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-forge-wine/10 rounded-full blur-[150px] animate-pulse" />
        <div className="absolute bottom-[0%] right-[-10%] w-[60%] h-[60%] bg-forge-wine-deep/10 rounded-full blur-[180px] animate-pulse delay-1000" />
        <div className="noise-bg opacity-30"></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 h-24 px-8 md:px-16 flex items-center justify-between border-b border-white/5 backdrop-blur-md bg-forge-black/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 wine-gradient rounded-xl flex items-center justify-center shadow-lg glow-border">
            <Zap className="text-white fill-white size-5" />
          </div>
          <span className="text-2xl font-black tracking-tighter italic uppercase glow-text-white">
            FORGE<span className="text-forge-wine-light">FIT</span>
          </span>
        </div>
        <button 
          onClick={signIn}
          className="text-[11px] font-black uppercase tracking-[0.3em] italic text-forge-gray hover:text-white transition-colors"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-24 pb-16 px-8 md:px-16 max-w-7xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full glass-panel border-white/10 mb-4">
             <div className="w-2 h-2 rounded-full bg-forge-wine-light animate-pulse"></div>
             <span className="text-[10px] font-black uppercase tracking-[0.4em] italic text-white/60">Version 2.0 Now Live</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tightest leading-[0.9] uppercase italic glow-text-white max-w-5xl mx-auto">
            Transform Your Body with <span className="text-forge-wine-light">Smarter</span> Training
          </h1>
          
          <p className="text-lg md:text-xl text-forge-gray max-w-3xl mx-auto leading-relaxed font-medium opacity-80">
            Your all-in-one fitness platform for workout planning, calorie tracking, macro monitoring, hydration goals, progress analytics, and AI-powered coaching.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={signIn}
              className="px-10 py-6 wine-gradient rounded-2xl font-black text-[12px] uppercase tracking-[0.4em] italic flex items-center gap-4 shadow-[0_0_40px_rgba(196,30,58,0.3)] hover:shadow-[0_0_60px_rgba(196,30,58,0.5)] transition-all glow-border"
            >
              Start Your Fitness Journey
              <ArrowRight size={18} strokeWidth={3} />
            </motion.button>
            <button 
              onClick={signIn}
              className="px-10 py-6 glass-panel rounded-2xl border-white/5 font-black text-[12px] uppercase tracking-[0.4em] italic text-forge-gray hover:text-white transition-all"
            >
              Learn More
            </button>
          </div>
        </motion.div>

        {/* Benefits Bar */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
          className="mt-20 flex flex-wrap justify-center gap-x-12 gap-y-6"
        >
          {[
            "AI Fitness Coach",
            "Smart Nutrition Tracking",
            "Personalized Workout Plans",
            "Progress Analytics",
            "Hydration Monitoring",
            "Built for Muscle Gain & Fat Loss"
          ].map((benefit, i) => (
            <div key={i} className="flex items-center gap-3 group">
              <CheckCircle2 size={16} className="text-forge-wine-light group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] italic text-forge-gray group-hover:text-white transition-colors">{benefit}</span>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Trust Section */}
      <section className="relative z-10 py-24 px-8 md:px-16 max-w-7xl mx-auto">
        <div className="text-center mb-20 space-y-4">
          <h2 className="text-4xl md:text-5xl font-black tracking-tight uppercase italic glow-text-white">
            Everything You Need To Reach Your Fitness Goals
          </h2>
          <div className="w-24 h-1 wine-gradient mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <FeatureCard 
            icon={<Dumbbell className="text-forge-wine-light" />} 
            title="Workout Tracking" 
            desc="Track exercises, sets, reps, and strength progression."
          />
          <FeatureCard 
            icon={<Beef className="text-forge-wine-light" />} 
            title="Nutrition Tracking" 
            desc="Monitor calories, protein, carbs, fats, and meals."
          />
          <FeatureCard 
            icon={<Brain className="text-forge-wine-light" />} 
            title="AI Coach" 
            desc="Get answers to workout, nutrition, recovery, and fitness questions."
          />
          <FeatureCard 
            icon={<TrendingUp className="text-forge-wine-light" />} 
            title="Progress Monitoring" 
            desc="Visualize your bodyweight and fitness progress over time."
          />
          <FeatureCard 
            icon={<Droplets className="text-forge-wine-light" />} 
            title="Hydration Tracking" 
            desc="Stay on target with personalized water intake goals."
          />
        </div>
      </section>

      {/* Transformation Section */}
      <section className="relative z-10 py-32 px-8 overflow-hidden bg-white/[0.02]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
           <div className="space-y-8">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic glow-text-white leading-[0.95]">
                Built For <br/> <span className="text-forge-wine-light">Real Results</span>
              </h2>
              <p className="text-xl text-forge-gray font-medium leading-relaxed max-w-xl opacity-80">
                Whether your goal is to lose fat, build muscle, gain strength, or improve athletic performance, ForgeFit helps you stay consistent and track everything that matters.
              </p>
              <div className="space-y-6">
                <div className="p-6 glass-panel border-white/5 rounded-2xl flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                    <TrendingUp size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest italic">+12lb Muscle LBM</p>
                    <p className="text-xs text-forge-gray font-bold uppercase tracking-widest italic opacity-50">12 Week Transformation</p>
                  </div>
                </div>
                <div className="p-6 glass-panel border-white/5 rounded-2xl flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                    <Flame size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-widest italic">-8% Body Fat</p>
                    <p className="text-xs text-forge-gray font-bold uppercase tracking-widest italic opacity-50">Strategic Cut Protocol</p>
                  </div>
                </div>
              </div>
           </div>

           <div className="relative">
              <div className="absolute -inset-20 bg-forge-wine/20 blur-[100px] rounded-full opacity-30"></div>
              <div className="relative glass-panel p-8 rounded-[3rem] border-white/5 shadow-2xl space-y-8">
                 <div className="h-48 w-full wine-gradient/10 rounded-2xl overflow-hidden relative">
                    <div className="absolute inset-0 flex items-end p-6">
                       <div className="w-full h-2/3 flex items-end gap-2">
                          {[40, 60, 45, 80, 55, 90, 70, 100].map((h, i) => (
                            <motion.div 
                              key={i}
                              initial={{ height: 0 }}
                              whileInView={{ height: `${h}%` }}
                              transition={{ delay: i * 0.1, duration: 1 }}
                              className="flex-1 wine-gradient rounded-t-lg shadow-xl"
                            />
                          ))}
                       </div>
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="h-32 glass-panel border-white/5 rounded-2xl flex items-center justify-center">
                       <Activity className="text-forge-wine-light size-10 opacity-20" />
                    </div>
                    <div className="h-32 glass-panel border-white/5 rounded-2xl flex items-center justify-center">
                       <Layout className="text-forge-wine-light size-10 opacity-20" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* AI Coach Showcase */}
      <section className="relative z-10 py-32 px-8 overflow-hidden">
        <div className="max-w-4xl mx-auto text-center space-y-16">
          <div className="space-y-4">
            <h2 className="text-5xl md:text-7xl font-black tracking-tight uppercase italic glow-text-white">
              Meet Your Personal <br/> <span className="text-forge-wine-light">AI Fitness Coach</span>
            </h2>
            <div className="w-16 h-1 wine-gradient mx-auto rounded-full"></div>
          </div>

          <div className="space-y-6 text-left">
             <ChatBubble question="How do I grow my chest?" answer="For maximum chest growth, focus on high-volume compound presses like the Bench Press and Incline Dumbbell Press. Ensure you're hitting all fibers by adding cable flies and prioritizing progressive overload." delay={0} />
             <ChatBubble question="How much protein do I need?" answer="Depending on your activity level and goals, aim for 1.6g to 2.2g of protein per kilogram of body weight. For muscle gain, the higher end of that range ensures optimal recovery and synthesis." delay={0.2} />
             <ChatBubble question="What's the best workout split?" answer="The 'best' split is the one you can stick to. Common effective options include Push/Pull/Legs (6 days), Upper/Lower (4 days), or Full Body (3 days)." delay={0.4} />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-32 px-8">
        <div className="max-w-5xl mx-auto text-center space-y-12">
           <div className="p-20 rounded-[4rem] wine-gradient shadow-[0_0_100px_rgba(122,17,40,0.3)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-1000"></div>
              
              <div className="relative z-10 space-y-10">
                 <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic glow-text-white">
                   Start Tracking. <br/> Start Improving.
                 </h2>
                 <p className="text-xl font-medium opacity-80 max-w-xl mx-auto">
                   Join ForgeFit and take control of your training, nutrition, recovery, and progress.
                 </p>
                 <motion.button 
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={signIn}
                   className="bg-white text-forge-black font-black px-12 py-7 rounded-2xl italic tracking-[0.5em] uppercase text-[12px] shadow-2xl flex items-center gap-4 mx-auto hover:brightness-110 active:scale-95 transition-all"
                 >
                   Create Free Account
                   <ChevronRight size={20} strokeWidth={4} />
                 </motion.button>
              </div>
           </div>
        </div>
      </section>

      <footer className="relative z-10 py-16 border-t border-white/5 text-center">
        <p className="text-[10px] text-forge-gray font-black uppercase tracking-[0.8em] italic opacity-20">
          ForgeFit Premium Fitness Environment • v2.0.4
        </p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-6 hover:bg-white/[0.04] transition-all group"
    >
      <div className="w-14 h-14 rounded-2xl bg-forge-wine/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
        {icon}
      </div>
      <div className="space-y-3">
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] italic glow-text-white">{title}</h3>
        <p className="text-[11px] text-forge-gray font-bold leading-relaxed uppercase tracking-widest opacity-50">{desc}</p>
      </div>
    </motion.div>
  );
}

function ChatBubble({ question, answer, delay }: { question: string, answer: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="space-y-4"
    >
      <div className="flex justify-end">
        <div className="glass-panel px-6 py-4 rounded-2xl rounded-tr-none border-white/5 max-w-sm">
          <p className="text-[10px] font-black uppercase tracking-widest italic glow-text-white">{question}</p>
        </div>
      </div>
      <div className="flex justify-start">
        <div className="wine-gradient px-6 py-4 rounded-2xl rounded-tl-none max-w-md shadow-xl">
          <p className="text-[10px] font-bold leading-relaxed">{answer}</p>
        </div>
      </div>
    </motion.div>
  );
}
