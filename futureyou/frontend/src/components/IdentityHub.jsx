import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Lock, ShieldCheck } from 'lucide-react';
import AvatarSetupModal from './AvatarSetupModal';

export default function IdentityHub() {
  const [activeTab, setActiveTab] = useState('avatar');
  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(true);

  const tabs = [
    { id: 'avatar', label: 'Avatar', icon: <User size={18} /> },
    { id: 'notifications', label: 'Alerts', icon: <Bell size={18} /> },
    { id: 'privacy', label: 'Privacy', icon: <Lock size={18} /> },
  ];

  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-700/50 overflow-hidden flex flex-col md:flex-row min-h-[400px]">
      {/* Sidebar */}
      <div className="md:w-1/3 bg-slate-900/50 border-r border-slate-700/50 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-2 hidden md:flex px-2">
          Identity Hub
        </h3>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium text-sm whitespace-nowrap
              ${activeTab === tab.id 
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20' 
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }
            `}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-6 relative">
        {activeTab === 'avatar' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white">Future Avatar Preference</h3>
              <p className="text-sm text-slate-400 mt-1">
                Customize the 3D entity representing your future self.
              </p>
            </div>
            
            <div className="flex items-center gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700">
              <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center border border-slate-600">
                <User size={24} className="text-slate-400" />
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">Standard Neural Avatar</div>
                <div className="text-xs text-emerald-400 mt-1">Active / Connected</div>
              </div>
              <button 
                onClick={() => setAvatarModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors border border-indigo-400/50 shadow-[0_0_15px_rgba(79,70,229,0.2)]"
              >
                Change Avatar
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'notifications' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-white">Smart Interventions</h3>
              <p className="text-sm text-slate-400 mt-1">
                Allow FutureYou to intervene when high-risk patterns (like late-night burnout) are detected.
              </p>
            </div>
            
            <div className="flex items-center justify-between bg-slate-800/40 p-4 rounded-xl border border-slate-700">
              <div>
                <div className="text-white font-medium">Behavioral Alerts</div>
                <div className="text-xs text-slate-400 mt-1">Push notifications & browser toasts</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={notificationEnabled} onChange={() => setNotificationEnabled(!notificationEnabled)} />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-500"></div>
              </label>
            </div>
          </motion.div>
        )}

        {activeTab === 'privacy' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
             <div>
              <h3 className="text-lg font-medium text-white">Privacy & Data Handling</h3>
              <p className="text-sm text-slate-400 mt-1">
                Transparency on how your data is used for behavioral prediction.
              </p>
            </div>
            <div className="space-y-3">
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700 flex items-start gap-3">
                <ShieldCheck className="text-emerald-400 mt-0.5" size={18} />
                <div>
                  <div className="text-slate-200 text-sm font-medium">No Raw Image Storage</div>
                  <div className="text-slate-400 text-xs mt-1">Avatar uploads are processed in memory and immediately discarded. Never saved to DB.</div>
                </div>
              </div>
              <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700 flex items-start gap-3">
                <ShieldCheck className="text-emerald-400 mt-0.5" size={18} />
                <div>
                  <div className="text-slate-200 text-sm font-medium">Telemetry Anonymization</div>
                  <div className="text-slate-400 text-xs mt-1">Habit data fed to inference models is decoupled from direct identity markers.</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
      
      <AvatarSetupModal 
        isOpen={isAvatarModalOpen} 
        onClose={() => setAvatarModalOpen(false)} 
        onComplete={(url) => { console.log("New Avatar Selected:", url); setAvatarModalOpen(false); }} 
      />
    </div>
  );
}
