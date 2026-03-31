import React from 'react';
import { motion } from 'framer-motion';
import { Target, Clock, ShieldCheck, Zap } from 'lucide-react';

const priorities = [
  {
    id: 1,
    title: 'Protect Sleep Core',
    why: 'Lack of sleep is driving 60% of your stress trajectory.',
    action: 'Commit to being in bed by 11:30 PM tonight.',
    benefit: 'Reduces burnout risk by 25% within 3 days.',
    icon: <Moon size={18} className="text-indigo-400" />
  },
  {
    id: 2,
    title: 'Micro-Breaks',
    why: 'Continuous focus blocks are degrading cognitive return.',
    action: 'Take a 10-min disconnected break after 90 mins of work.',
    benefit: 'Improves late-day wellbeing scores by +15%.',
    icon: <Clock size={18} className="text-amber-400" />
  },
  {
    id: 3,
    title: 'Regulate Workload',
    why: 'Current trajectory points to weekend crash.',
    action: 'Move two non-essential tasks to next week.',
    benefit: 'Preserves weekend recovery capacity completely.',
    icon: <ShieldCheck size={18} className="text-emerald-400" />
  }
];

export default function RecoveryPlanPanel() {
  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Target className="text-emerald-400" /> 24-Hour Reset Plan
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Your high-leverage corrective measures to alter your path.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-emerald-900/20 text-emerald-400 px-3 py-1.5 rounded-full border border-emerald-500/20 text-xs font-semibold">
          <Zap size={14} /> Immediate Action
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {priorities.map((item, index) => (
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            key={item.id} 
            className="group flex gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700 hover:bg-slate-800/80 transition-colors"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-600 group-hover:scale-110 transition-transform">
              {item.icon}
            </div>
            <div className="flex-1">
              <h4 className="text-white font-medium mb-1 flex items-center gap-2">
                {item.title}
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-700 text-slate-300">
                  Priority {item.id}
                </span>
              </h4>
              <p className="text-slate-400 text-sm mb-2">{item.why}</p>
              <div className="bg-slate-900/50 rounded-lg p-3 text-sm">
                <span className="text-indigo-300 font-medium">To-do:</span> <span className="text-slate-300">{item.action}</span>
              </div>
              <div className="mt-3 text-xs text-emerald-400/80 flex items-center gap-1 font-medium">
                ↳ {item.benefit}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      <button className="w-full mt-6 py-3 rounded-lg border border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors text-sm font-medium">
        View Week-by-Week Improvement Roadmap
      </button>
    </div>
  );
}
