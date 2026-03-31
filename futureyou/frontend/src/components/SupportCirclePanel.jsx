import React, { useState } from 'react';
import { HeartHandshake, ShieldAlert, Users, Info } from 'lucide-react';

export default function SupportCirclePanel() {
  const [isEnabled, setIsEnabled] = useState(true);

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <HeartHandshake className="text-pink-400" /> Support Circle
          </h2>
          <p className="text-slate-400 text-sm mt-1 max-w-sm">
            Consent-based safety net. If prolonged high-risk patterns are detected, your trusted support contact is gently notified to check in.
          </p>
        </div>
        <div className="flex items-center">
          <label className="relative inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              className="sr-only peer" 
              checked={isEnabled}
              onChange={() => setIsEnabled(!isEnabled)}
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-500"></div>
          </label>
        </div>
      </div>

      <div className={`transition-opacity duration-300 ${isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700 mb-4">
          <h4 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
            <Users size={16} /> Active Guardian
          </h4>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
            <div>
              <div className="text-white font-medium">Sarah Jenkins</div>
              <div className="text-xs text-slate-400">Academic Advisor • sarah.j@university.edu</div>
            </div>
            <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium px-3 py-1.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 transition-colors">
              Edit Contact
            </button>
          </div>
        </div>

        {/* Guardian Insight Card */}
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-900/10">
          <h4 className="text-sm font-semibold text-indigo-300 mb-2 flex items-center gap-2">
            <Info size={16} /> Insight Trigger Status
          </h4>
          <div className="flex items-center gap-3 text-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-slate-300">All clear. No escalation recommended currently.</span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50 flex flex-col">
              <span className="text-slate-500">Support Needed</span>
              <span className="text-slate-300 mt-0.5 font-medium">Mild (Sleep Habits)</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border border-slate-700/50 flex flex-col">
              <span className="text-slate-500">Risk Trend</span>
              <span className="text-emerald-400 mt-0.5 font-medium flex items-center gap-1">
                <TrendingDown size={12} /> Decreasing
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}