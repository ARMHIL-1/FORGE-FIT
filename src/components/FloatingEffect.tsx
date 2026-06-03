import React from 'react';
import { motion } from 'framer-motion';

export function FloatingEffect() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 3D Floating Elements */}
      <FloatingShape 
        className="top-[10%] left-[5%] w-64 h-64 bg-forge-wine/5 blur-3xl"
        delay={0}
        duration={20}
      />
      <FloatingShape 
        className="bottom-[15%] right-[10%] w-96 h-96 bg-forge-wine-light/5 blur-3xl text-forge-wine-light/10"
        delay={5}
        duration={25}
      />
      <FloatingShape 
        className="top-[40%] right-[15%] w-48 h-48 bg-white/5 blur-2xl"
        delay={2}
        duration={18}
      />
      
      {/* Geometric Accents */}
      <div className="absolute top-1/4 left-1/4 opacity-10 rotate-12 animate-float">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none" stroke="currentColor" className="text-forge-wine-light">
          <rect x="10" y="10" width="80" height="80" strokeWidth="0.5" />
          <rect x="25" y="25" width="50" height="50" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="absolute bottom-1/3 right-1/4 opacity-5 -rotate-12 animate-float" style={{ animationDelay: '2s' }}>
        <svg width="150" height="150" viewBox="0 0 150 150" fill="none" stroke="currentColor" className="text-white">
          <circle cx="75" cy="75" r="70" strokeWidth="0.5" strokeDasharray="5 5" />
          <circle cx="75" cy="75" r="40" strokeWidth="0.5" />
        </svg>
      </div>
    </div>
  );
}

function FloatingShape({ className, delay = 0, duration = 20 }: { className: string, delay?: number, duration?: number }) {
  return (
    <motion.div
      initial={{ x: 0, y: 0, rotate: 0 }}
      animate={{ 
        x: [0, 50, -30, 0], 
        y: [0, -50, 40, 0],
        rotate: [0, 90, 180, 0]
      }}
      transition={{ 
        duration, 
        repeat: Infinity, 
        ease: "linear",
        delay 
      }}
      className={`absolute rounded-full ${className}`}
    />
  );
}
