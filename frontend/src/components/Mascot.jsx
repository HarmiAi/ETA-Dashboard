import React from 'react';
import { motion } from 'framer-motion';

export default function Mascot({ tasks = [] }) {
  // Determine mascot state based on tasks
  const overdueCount = tasks.filter((t) => t.status === 'Overdue').length;
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const totalCount = tasks.length;

  let state = 'happy'; // Default: happy and typing

  if (overdueCount > 0) {
    state = 'concerned';
  } else if (totalCount > 0 && completedCount === totalCount) {
    state = 'celebrating';
  }

  // Animation variants
  const earLeftVariants = {
    happy: { rotate: [0, -4, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
    concerned: { rotate: 18, y: 3 },
    celebrating: { rotate: [-10, 10, -10], transition: { repeat: Infinity, duration: 0.8, ease: "easeInOut" } }
  };

  const earRightVariants = {
    happy: { rotate: [0, 4, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
    concerned: { rotate: -18, y: 3 },
    celebrating: { rotate: [10, -10, 10], transition: { repeat: Infinity, duration: 0.8, ease: "easeInOut" } }
  };

  const tailVariants = {
    happy: { rotate: [-15, 15, -15], transition: { repeat: Infinity, duration: 1.2, ease: "easeInOut" } },
    concerned: { rotate: -40 },
    celebrating: { rotate: [-30, 30, -30], transition: { repeat: Infinity, duration: 0.5, ease: "easeInOut" } }
  };

  const bodyVariants = {
    happy: { y: [0, -2, 0], transition: { repeat: Infinity, duration: 2, ease: "easeInOut" } },
    concerned: { y: 2 },
    celebrating: { y: [0, -8, 0], transition: { repeat: Infinity, duration: 0.6, ease: "easeInOut" } }
  };

  const eyeLeftVariants = {
    happy: { scaleY: [1, 1, 0.1, 1, 1], transition: { repeat: Infinity, duration: 3, times: [0, 0.4, 0.45, 0.5, 1] } },
    concerned: { scaleY: 0.7, y: 1 },
    celebrating: { scaleY: [1, 1, 0.1, 1, 1], transition: { repeat: Infinity, duration: 2 } }
  };

  const eyeRightVariants = {
    happy: { scaleY: [1, 1, 0.1, 1, 1], transition: { repeat: Infinity, duration: 3, times: [0, 0.4, 0.45, 0.5, 1] } },
    concerned: { scaleY: 0.7, y: 1 },
    celebrating: { scaleY: [1, 1, 0.1, 1, 1], transition: { repeat: Infinity, duration: 2 } }
  };

  const pawLeftVariants = {
    happy: { y: [0, -6, 0], rotate: [0, -5, 0], transition: { repeat: Infinity, duration: 0.4, ease: "easeInOut" } },
    concerned: { y: 2, rotate: 10 },
    celebrating: { y: -25, rotate: -20, transition: { duration: 0.3 } }
  };

  const pawRightVariants = {
    happy: { y: [-6, 0, -6], rotate: [0, 5, 0], transition: { repeat: Infinity, duration: 0.4, ease: "easeInOut" } },
    concerned: { y: 2, rotate: -10 },
    celebrating: { y: -25, rotate: 20, transition: { duration: 0.3 } }
  };

  const laptopVariants = {
    happy: { scale: 1, rotate: 0 },
    concerned: { scale: 0.95, opacity: 0.8 },
    celebrating: { scale: 0.9, rotate: -15, x: -20, opacity: 0.6 }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl h-full relative overflow-hidden glass-card">
      {/* Decorative subtle pulse glow in background */}
      <div className={`absolute inset-0 w-full h-full -z-10 opacity-10 transition-colors duration-500 ${
        state === 'concerned' ? 'bg-red-500' :
        state === 'celebrating' ? 'bg-emerald-500' :
        'bg-blue-500'
      }`} />

      {/* SVG Canvas for High-Fidelity Vector Puppy Mascot */}
      <motion.svg
        viewBox="0 0 200 200"
        className="w-40 h-40 drop-shadow-xl"
        variants={bodyVariants}
        animate={state}
      >
        {/* Tail (Backside layer) */}
        <motion.path
          d="M 50,140 C 35,130 20,110 15,90 C 20,85 25,90 35,105 C 45,120 50,130 50,140 Z"
          fill="#c084fc" // Purple tail matching custom brand palette
          stroke="#4b5563"
          strokeWidth="1.5"
          originX="50px"
          originY="140px"
          variants={tailVariants}
        />
        
        {/* Puppy Body Spot Overlay */}
        <ellipse cx="100" cy="140" rx="35" ry="30" fill="#E5E7EB" /> {/* Light white body */}
        <path d="M 75,120 Q 90,125 95,145 Q 85,160 70,145 Z" fill="#D97706" /> {/* Brown body spot */}

        {/* Feet / Paws Bottom */}
        <ellipse cx="75" cy="170" rx="12" ry="7" fill="#E5E7EB" stroke="#D1D5DB" />
        <ellipse cx="125" cy="170" rx="12" ry="7" fill="#E5E7EB" stroke="#D1D5DB" />

        {/* Head Base */}
        <circle cx="100" cy="85" r="32" fill="#E5E7EB" stroke="#D1D5DB" strokeWidth="0.5" />

        {/* Brown Patch Left Eye */}
        <path d="M 68,80 C 68,60 90,60 90,80 C 90,100 68,100 68,80 Z" fill="#D97706" />

        {/* Left Ear (Brown, floppy) */}
        <motion.path
          d="M 72,60 C 60,60 50,75 52,95 C 54,115 70,110 74,90 Z"
          fill="#B45309" // Dark brown ear
          originX="72px"
          originY="60px"
          variants={earLeftVariants}
        />

        {/* Right Ear (Brown, floppy) */}
        <motion.path
          d="M 128,60 C 140,60 150,75 148,95 C 146,115 130,110 126,90 Z"
          fill="#B45309" // Dark brown ear
          originX="128px"
          originY="60px"
          variants={earRightVariants}
        />

        {/* Eyes */}
        <motion.ellipse
          cx="82"
          cy="80"
          rx="4"
          ry="6"
          fill="#0B0F19"
          originX="82px"
          originY="80px"
          variants={eyeLeftVariants}
        />
        <motion.ellipse
          cx="118"
          cy="80"
          rx="4"
          ry="6"
          fill="#0B0F19"
          originX="118px"
          originY="80px"
          variants={eyeRightVariants}
        />

        {/* Eye sparkles */}
        {state !== 'concerned' && (
          <>
            <circle cx="80.5" cy="78.5" r="1.2" fill="#FFFFFF" />
            <circle cx="116.5" cy="78.5" r="1.2" fill="#FFFFFF" />
          </>
        )}

        {/* White Muzzle */}
        <path d="M 90,92 C 90,84 110,84 110,92 C 110,102 90,102 90,92 Z" fill="#FFFFFF" />
        
        {/* Nose (Black) */}
        <polygon points="97,90 103,90 100,94" fill="#0B0F19" />
        
        {/* Mouth */}
        <path d="M 97,96 Q 100,98 103,96" fill="none" stroke="#0B0F19" strokeWidth="1.5" strokeLinecap="round" />

        {/* Tongue when celebrating / happy */}
        {state === 'celebrating' && (
          <path d="M 98,97 Q 100,103 102,97 Z" fill="#EF4444" />
        )}

        {/* Typing Paws (Front Layer) */}
        <motion.g originX="100px" originY="130px">
          {/* Left Paw */}
          <motion.path
            d="M 82,120 Q 75,120 75,132 Q 75,140 85,140 Q 92,140 90,125 Z"
            fill="#E5E7EB"
            stroke="#D1D5DB"
            strokeWidth="0.5"
            originX="82px"
            originY="120px"
            variants={pawLeftVariants}
          />
          {/* Right Paw */}
          <motion.path
            d="M 118,120 Q 125,120 125,132 Q 125,140 115,140 Q 108,140 110,125 Z"
            fill="#E5E7EB"
            stroke="#D1D5DB"
            strokeWidth="0.5"
            originX="118px"
            originY="120px"
            variants={pawRightVariants}
          />
        </motion.g>

        {/* Mini Laptop Vector */}
        <motion.g
          originX="100px"
          originY="160px"
          variants={laptopVariants}
        >
          {/* Keyboard base */}
          <path d="M 70,160 L 130,160 L 140,175 L 60,175 Z" fill="#334155" stroke="#475569" strokeWidth="1" />
          
          {/* Laptop screen open */}
          <path d="M 75,122 L 125,122 L 130,160 L 70,160 Z" fill="#1E293B" stroke="#475569" strokeWidth="1" />
          
          {/* Screen glow inside */}
          {state !== 'celebrating' && (
            <path
              d="M 78,126 L 122,126 L 126,156 L 74,156 Z"
              fill={state === 'concerned' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.2)'}
            />
          )}

          {/* Little coding stripes on screen */}
          {state === 'happy' && (
            <>
              <line x1="82" y1="132" x2="105" y2="132" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
              <line x1="82" y1="138" x2="115" y2="138" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
              <line x1="82" y1="144" x2="95" y2="144" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" />
              <line x1="82" y1="150" x2="100" y2="150" stroke="#F472B6" strokeWidth="2" strokeLinecap="round" />
            </>
          )}

          {/* Warning sign on laptop if concerned */}
          {state === 'concerned' && (
            <path d="M 100,132 L 106,146 L 94,146 Z" fill="#F59E0B" />
          )}
        </motion.g>
      </motion.svg>

      {/* Dynamic speech bubble containing productivity statuses */}
      <div className="mt-4 text-center z-10">
        <h4 className="text-sm font-bold text-white">
          {state === 'concerned' ? 'Alarms Triggered!' :
           state === 'celebrating' ? 'Day Cleared! 🎉' :
           'Monitoring Milestones'}
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
          {state === 'concerned' ? 'We have overdue tasks! Let\'s follow up with the team.' :
           state === 'celebrating' ? 'Awesome job! All daily ETAs have been completed on time.' :
           'I am tracking team milestones live. Everything is running smoothly!'}
        </p>
      </div>

      {/* Floating sparkles when celebrating */}
      {state === 'celebrating' && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-8 left-10 w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping" />
          <div className="absolute top-12 right-12 w-2 h-2 bg-purple-400 rounded-full animate-bounce" />
          <div className="absolute bottom-16 left-12 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
        </div>
      )}
    </div>
  );
}
