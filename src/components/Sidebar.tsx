import React from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Utensils, 
  Dumbbell, 
  LineChart, 
  User,
  LogOut,
  Flame,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onLogout?: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'coach', label: 'AI Coach', icon: MessageSquare },
  { id: 'nutrition', label: 'MEAL PLAN', icon: Utensils },
  { id: 'workout', label: 'WORKOUT PLAN', icon: Dumbbell },
  { id: 'progress', label: 'Analytics', icon: LineChart },
  { id: 'profile', label: 'Profile', icon: User },
];

export function Sidebar({ activeTab, setActiveTab, onLogout }: SidebarProps) {
  const [showLogoutConfirm, setShowLogoutConfirm] = React.useState(false);

  return (
    <aside className="w-56 border-r border-white/5 flex flex-col py-10 flex-shrink-0 bg-forge-black relative z-40 overflow-hidden">
      <AnimatePresence>
        {showLogoutConfirm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-forge-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6 text-center"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="space-y-6"
            >
              <div className="w-16 h-16 wine-gradient rounded-2xl mx-auto flex items-center justify-center shadow-2xl">
                <LogOut size={24} className="text-white" />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-black text-white uppercase tracking-[0.2em] italic">Terminate Session?</h4>
                <p className="text-[10px] text-forge-gray uppercase tracking-widest leading-relaxed">Neural link will be severed.</p>
              </div>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={onLogout}
                  className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-xl transition-all italic"
                >
                  Confirm Exit
                </button>
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="w-full py-3 glass-panel text-forge-gray hover:text-white font-black text-[10px] uppercase tracking-[0.3em] rounded-xl transition-all italic"
                >
                  Stay Connected
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="px-6 mb-12">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="w-full py-4 wine-gradient rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-500 glow-border group relative overflow-hidden shadow-2xl" 
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <div className="flex items-center gap-3 relative z-10">
            <Zap size={22} className="text-white fill-current" />
            <span className="text-[11px] font-black tracking-[0.3em] text-white uppercase italic">ForgeFit</span>
          </div>
        </motion.div>
      </div>

      <nav className="flex flex-col gap-2 flex-1 px-4">
        {navItems.map((item, idx) => (
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              "w-full px-4 py-3.5 flex items-center gap-4 rounded-xl transition-all duration-500 relative group",
              activeTab === item.id 
                ? "bg-forge-wine/20 text-white shadow-lg glass-panel wine-border-dim" 
                : "text-forge-gray hover:text-white hover:bg-white/5"
            )}
          >
            {activeTab === item.id && (
              <motion.div 
                layoutId="activeGlow"
                className="absolute inset-0 bg-forge-wine/5 blur-[15px] rounded-full scale-110"
              />
            )}
            <item.icon size={20} strokeWidth={activeTab === item.id ? 2.5 : 1.5} className={cn("relative z-10 transition-all", activeTab === item.id && "glow-text-white")} />
            <span className={cn(
              "text-[10px] font-black uppercase tracking-[0.3em] relative z-10 italic transition-all",
              activeTab === item.id ? "opacity-100" : "opacity-40 group-hover:opacity-100"
            )}>
              {item.label}
            </span>
          </motion.button>
        ))}
      </nav>

      <div className="mt-auto px-4 flex flex-col gap-8">
        <motion.button 
          whileHover={{ x: 5, color: '#DC2626' }}
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full px-4 py-4 flex items-center gap-4 text-forge-gray transition-all duration-500 glass-panel rounded-xl border-white/5"
        >
          <LogOut size={20} strokeWidth={1.5} />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Sign Out</span>
        </motion.button>
        
        <div className="px-4 py-6 border-t border-white/5 flex flex-col gap-2 opacity-30 hover:opacity-100 transition-opacity cursor-default">
          <div className="text-[9px] text-forge-wine-light font-black uppercase tracking-[0.5em] italic glow-text-wine">
            EST. 2024
          </div>
          <div className="text-[8px] text-forge-gray font-black uppercase tracking-[0.4em]">
            SYSTEM CORE V9.4
          </div>
        </div>
      </div>
    </aside>
  );
}
