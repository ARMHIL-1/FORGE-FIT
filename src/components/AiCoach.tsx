import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../lib/utils';
import { UserProfile, ChatMessage, WorkoutLog, WeightLog, NutritionLog } from '../types';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

interface AiCoachProps {
  userProfile: UserProfile;
}

export function AiCoach({ userProfile }: AiCoachProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { 
      role: 'model', 
      text: `Hi! ${userProfile.name}. I am your specialized Forge AI coach. I can help you with your meal nutritions and create your workout plan!!` 
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activityContext, setActivityContext] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const workoutsQuery = query(
          collection(db, 'workout_logs'),
          where('userId', '==', userProfile.userId),
          orderBy('date', 'desc'),
          limit(3)
        );
        const weightQuery = query(
          collection(db, 'weight_logs'),
          where('userId', '==', userProfile.userId),
          orderBy('date', 'desc'),
          limit(3)
        );
        const nutritionQuery = query(
          collection(db, 'nutrition_logs'),
          where('userId', '==', userProfile.userId),
          orderBy('timestamp', 'desc'),
          limit(5)
        );

        const docs = await Promise.all([
          getDocs(workoutsQuery),
          getDocs(weightQuery),
          getDocs(nutritionQuery)
        ]).catch(err => {
          handleFirestoreError(err, OperationType.LIST, 'fitness_context');
          throw err;
        });

        const [workoutDocs, weightDocs, nutritionDocs] = docs;

        setActivityContext({
          recentWorkouts: workoutDocs.docs.map(doc => doc.data() as WorkoutLog),
          recentWeights: weightDocs.docs.map(doc => doc.data() as WeightLog),
          recentNutrition: nutritionDocs.docs.map(doc => doc.data() as NutritionLog)
        });
      } catch (err) {
        console.error("Context fetch error:", err);
      }
    };

    fetchContext();
  }, [userProfile.userId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/coach/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userProfile,
          context: activityContext
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Data relay exception');
      }
      
      const data = await response.json();
      setMessages(prev => [...prev, { role: 'model', text: data.text }]);
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message?.includes("503") || error.message?.includes("UNAVAILABLE")
        ? "Forge AI Coach is currently under heavy load. Please try again in a moment."
        : "Connection lost. Please re-attempt your question.";
      
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col font-sans animate-in fade-in duration-700">
      <div className="flex-1 min-h-0 flex flex-col glass-panel rounded-2xl overflow-hidden relative shadow-2xl">
        <header className="px-8 py-4 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md relative z-10">
          <div className="flex items-center gap-4">
             <div className="w-10 h-10 wine-gradient rounded-xl flex items-center justify-center glow-border animate-float">
                <Sparkles size={20} className="text-white" />
             </div>
             <div>
                <h3 className="text-[9px] uppercase tracking-[0.4em] font-black text-forge-gray opacity-40 italic">AI COACH</h3>
                <p className="text-base font-black text-white italic uppercase tracking-tighter glow-text-white">Forge AI</p>
             </div>
          </div>
          <div className="flex items-center gap-3 bg-black/40 px-5 py-2 rounded-full border border-white/5 shadow-inner">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Online</span>
          </div>
        </header>

        {/* Messages */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide relative z-10"
        >
          {messages.map((msg, idx) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={idx}
              className={cn(
                "flex gap-6 max-w-[90%]",
                msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              <div className={cn(
                "w-10 h-10 flex-shrink-0 border flex items-center justify-center transition-all duration-500 rounded-xl font-black text-[9px] uppercase tracking-widest overflow-hidden",
                msg.role === 'model' 
                  ? "border-forge-wine/30 bg-forge-wine/10 text-forge-wine-light glow-border" 
                  : "border-white/10 bg-white/5 text-white"
              )}>
                <div className="absolute inset-0 wine-gradient opacity-10"></div>
                {msg.role === 'model' ? <Bot size={18} className="relative z-10" /> : <User size={18} className="relative z-10" />}
              </div>
              <div className={cn(
                "py-1 space-y-2",
                msg.role === 'user' ? "text-right" : "text-left"
              )}>
                <div className={cn(
                  "px-6 py-4 rounded-2xl text-[13px] leading-relaxed shadow-lg backdrop-blur-sm",
                  "wine-gradient text-white border border-forge-wine/30"
                )}>
                  <div className="markdown-body prose-invert prose-sm overflow-x-auto">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </div>
                </div>
                <p className="text-[8px] font-black text-forge-gray uppercase tracking-[0.3em] opacity-30 px-3 mt-1 italic">
                   {msg.role === 'model' ? "Processed by Forge-LITE" : "You"}
                </p>
              </div>
            </motion.div>
          ))}
          {isLoading && (
            <div className="flex gap-6 max-w-[80%]">
              <div className="w-10 h-10 border border-forge-wine/30 bg-forge-wine/10 text-forge-wine-light flex items-center justify-center animate-pulse rounded-xl shadow-xl glow-border">
                <Sparkles size={16} />
              </div>
              <div className="flex flex-col justify-center gap-1.5">
                <div className="flex items-center gap-2">
                   <div className="w-1 h-1 bg-forge-wine-light rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-1 h-1 bg-forge-wine-light rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-1 h-1 bg-forge-wine-light rounded-full animate-bounce"></div>
                </div>
                <span className="text-[9px] text-forge-wine-light font-black uppercase tracking-[0.4em] italic opacity-60">Synthesizing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Suggestion Tags */}
        <div className="px-8 py-4 bg-black/20 flex gap-3 overflow-x-auto border-t border-white/5 scrollbar-hide relative z-10">
          {["System Analysis", "Refine Macros", "Workout Tuning", "Recovery Status"].map((tag) => (
            <button
              key={tag}
              onClick={() => setInput(tag)}
              className="whitespace-nowrap px-6 py-2 glass-panel border-white/5 rounded-xl text-[9px] uppercase tracking-[0.3em] font-black text-forge-gray hover:text-white hover:border-forge-wine/40 transition-all cursor-pointer shadow-lg italic"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-8 bg-forge-black/40 backdrop-blur-3xl border-t border-white/5 relative z-10">
          <div className="flex gap-4">
            <div className="relative flex-1 group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-forge-wine/20 to-forge-wine-deep/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-1000 group-focus-within:opacity-100"></div>
              <input
                value={input}
                onChange={(e) => e.target.value.length < 500 && setInput(e.target.value)}
                placeholder="Ask coach anything here"
                className="w-full glass-panel border-white/5 text-white px-8 py-4.5 rounded-xl focus:outline-none focus:border-forge-wine/40 transition-all placeholder:text-forge-gray placeholder:opacity-20 font-black text-[12px] tracking-widest relative z-10 italic shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="w-12 h-12 wine-gradient rounded-xl flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all disabled:opacity-20 shadow-2xl relative overflow-hidden shrink-0"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity"></div>
              <Send size={20} strokeWidth={3} className="relative z-10" />
            </button>
          </div>
        </form>

        {/* Background Ambient Effect */}
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-forge-wine/5 blur-[100px] -z-0 rounded-full"></div>
      </div>
    </div>
  );
}
