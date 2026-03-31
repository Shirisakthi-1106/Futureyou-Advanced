import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const personas = [
  { id: 'present', label: 'Present You', desc: 'Analytical & Aware', color: 'bg-indigo-500' },
  { id: 'future', label: 'Future You', desc: 'Optimized & Recovered', color: 'bg-emerald-500' },
  { id: 'burnout', label: 'Burnout You', desc: 'Cautionary & Regretful', color: 'bg-red-500' }
];

export default function PersonaChatTabs({ activePersona, onSelect }) {
  return (
    <div className="flex justify-between md:justify-center items-center gap-2 p-1.5 bg-slate-800/60 rounded-xl max-w-full overflow-x-auto border border-slate-700/50 my-4">
      {personas.map((persona) => {
        const isActive = activePersona === persona.id;
        return (
          <button
            key={persona.id}
            onClick={() => onSelect(persona.id)}
            className={`relative flex-1 md:flex-none flex flex-col items-center justify-center px-4 py-3 min-w-[120px] rounded-lg transition-colors z-10 ${
              isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
            }`}
          >
            {isActive && (
              <motion.div
                layoutId="personaTab"
                className="absolute inset-0 bg-slate-700/80 rounded-lg shadow-sm"
                initial={false}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 font-semibold text-sm flex items-center gap-2">
              {isActive && (
                <span className={`w-2 h-2 rounded-full ${persona.color} shadow-[0_0_8px_currentColor] animate-pulse`} />
              )}
              {persona.label}
            </span>
            <span className="relative z-10 text-[10px] mt-1 opacity-70 uppercase tracking-widest hidden sm:block">
              {persona.desc}
            </span>
          </button>
        );
      })}
    </div>
  );
}
