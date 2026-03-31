import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Moon, BookOpen, Brain, Activity } from 'lucide-react';

const paths = {
  drift: {
    title: 'Drift Path',
    subtitle: 'If nothing changes...',
    description: 'Current habits lead to increased burnout risk and lower performance.',
    color: 'border-red-500/50 bg-red-900/20 text-red-400',
    stats: { stress: '+35%', wellbeing: '-20%', performance: '-15%' },
    icon: <TrendingDown size={20} />
  },
  recovery: {
    title: 'Recovery Path',
    subtitle: 'If you start recovering...',
    description: 'Small, consistent improvements create a stable bridge to future stability.',
    color: 'border-blue-500/50 bg-blue-900/20 text-blue-400',
    stats: { stress: '-10%', wellbeing: '+15%', performance: '+5%' },
    icon: <Activity size={20} />
  },
  thriving: {
    title: 'Thriving Path',
    subtitle: 'If you fully commit...',
    description: 'Optimized routines compound into peak personal and academic performance.',
    color: 'border-emerald-500/50 bg-emerald-900/20 text-emerald-400',
    stats: { stress: '-40%', wellbeing: '+50%', performance: '+30%' },
    icon: <TrendingUp size={20} />
  }
};

export default function SimulationPanel({ predictions, onModeChange }) {
  const [activePath, setActivePath] = useState('recovery');

  const handleSelect = (key) => {
    setActivePath(key);
    if (onModeChange) onModeChange(key);
  };

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6 flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Brain className="text-indigo-400" /> Future Trajectory Simulator
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Explore how today's choices shape your future states. 
          <span className="text-indigo-300 ml-1">We don't just predict the future; we help you shape it.</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(paths).map(([key, data]) => (
          <button
            key={key}
            onClick={() => handleSelect(key)}
            className={`relative p-5 rounded-xl border-2 text-left transition-all duration-300 overflow-hidden group
              ${activePath === key ? data.color : 'border-slate-800 bg-slate-800/40 text-slate-500 hover:border-slate-600'}
            `}
          >
            {activePath === key && (
              <motion.div 
                layoutId="sim-active-bg" 
                className="absolute inset-0 bg-white/5" 
                initial={false}
                transition={{ duration: 0.3 }}
              />
            )}
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-2">
                <h3 className={`font-semibold text-lg ${activePath === key ? 'text-white' : 'text-slate-300'}`}>
                  {data.title}
                </h3>
                <div className={`${activePath === key ? '' : 'opacity-50'}`}>{data.icon}</div>
              </div>
              <p className={`text-xs font-medium uppercase tracking-wider mb-3 ${activePath === key ? 'opacity-80' : 'opacity-60'}`}>
                {data.subtitle}
              </p>
              <div className="flex gap-3 text-xs font-medium">
                <div className="flex flex-col">
                  <span className="text-slate-400">Stress</span>
                  <span className={data.stats.stress.startsWith('+') && key === 'drift' ? 'text-red-400' : 'text-emerald-400'}>
                    {data.stats.stress}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400">Wellbeing</span>
                  <span className={data.stats.wellbeing.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}>
                    {data.stats.wellbeing}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Future Gap Details */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePath}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50"
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${paths[activePath].color.split(' ')[1]}`}>
              {paths[activePath].icon}
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">Impact Analysis</h4>
              <p className="text-slate-300 text-sm leading-relaxed">
                {paths[activePath].description}
              </p>
              {activePath === 'drift' && (
                <div className="mt-3 text-red-400 text-xs font-semibold bg-red-400/10 inline-block px-3 py-1 rounded-full">
                  High Risk of Burnout Detected
                </div>
              )}
              {activePath === 'thriving' && (
                <div className="mt-3 text-emerald-400 text-xs font-semibold bg-emerald-400/10 inline-block px-3 py-1 rounded-full">
                  Optimal State Reachable in 3 Weeks
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
