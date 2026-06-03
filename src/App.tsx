/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { AiCoach } from './components/AiCoach';
import { NutritionTracker } from './components/NutritionTracker';
import { WorkoutPlanner } from './components/WorkoutPlanner';
import { Analytics } from './components/Analytics';
import { ProfileView } from './components/ProfileView';
import { Login } from './components/Login';
import { FloatingEffect } from './components/FloatingEffect';
import { FirebaseProvider, useFirebase } from './contexts/FirebaseContext';
import { UserProfile } from './types';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { user, userProfile, loading, logout, updateProfile } = useFirebase();

  // Onboarding enforcement
  const needsOnboarding = userProfile && !userProfile.goal;
  
  const currentTab = needsOnboarding ? 'profile' : activeTab;

  if (loading) {
    return (
      <div className="min-h-screen bg-forge-black flex items-center justify-center relative overflow-hidden">
        <div className="noise-bg"></div>
        <FloatingEffect />
        <div className="text-center space-y-8 relative z-10">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-32 h-32 wine-gradient rounded-[2.5rem] mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(122,17,40,0.4)] glow-border"
          >
            <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          </motion.div>
          <p className="text-forge-gray font-black uppercase tracking-[0.8em] text-[10px] glow-text-white italic">Neural Link Established</p>
        </div>
      </div>
    );
  }

  if (!user || !userProfile) {
    return (
      <>
        <div className="noise-bg"></div>
        <Login />
      </>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <Dashboard userProfile={userProfile} />;
      case 'coach':
        return <AiCoach userProfile={userProfile} />;
      case 'nutrition':
        return <NutritionTracker userProfile={userProfile} />;
      case 'workout':
        return <WorkoutPlanner userProfile={userProfile} />;
      case 'progress':
        return <Analytics userProfile={userProfile} />;
      case 'profile':
        return <ProfileView userProfile={userProfile} onUpdate={(p) => updateProfile(p)} needsOnboarding={needsOnboarding} />;
      default:
        return <Dashboard userProfile={userProfile} />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-forge-black text-white font-sans overflow-hidden relative">
      <div className="noise-bg"></div>
      <FloatingEffect />
      
      <Sidebar 
        activeTab={currentTab} 
        setActiveTab={needsOnboarding ? () => {} : setActiveTab} 
        onLogout={logout} 
      />
      
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 flex-shrink-0 bg-forge-black/20 backdrop-blur-md z-30">
          <div className="flex items-center gap-6">
            <div className="h-8 w-1 wine-gradient rounded-full glow-border"></div>
            <div>
              <p className="text-xl font-black tracking-tighter text-white uppercase italic">
                <span className="text-forge-wine-light glow-text-wine">Athlete:</span> {userProfile.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl glass-panel flex items-center justify-center wine-border-dim group cursor-pointer overflow-hidden shadow-2xl">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="w-full h-full flex items-center justify-center bg-forge-wine/20 text-white font-black text-sm italic glow-text-white"
                >
                  {userProfile.name.charAt(0)}
                </motion.div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-10 py-12 relative">
          <div className="max-w-7xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        <footer className="h-14 border-t border-white/5 flex items-center justify-between px-12 text-[10px] uppercase tracking-[0.6em] font-black text-forge-gray bg-forge-black/40 backdrop-blur-md flex-shrink-0 z-30 italic">
          <div className="flex gap-12">
            <span className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full wine-gradient animate-pulse shadow-[0_0_8px_rgba(122,17,40,0.8)]"></div>
              Neural Identity Verified
            </span>
            <span className="opacity-20">Protocol Status: Optimal</span>
          </div>
          <div className="flex gap-12 hidden md:flex opacity-20 hover:opacity-100 transition-opacity">
            <span>Terminal V9.4.0</span>
            <span>Security Active</span>
          </div>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <AppContent />
    </FirebaseProvider>
  );
}

