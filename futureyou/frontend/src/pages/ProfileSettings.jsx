import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { User, Shield, Bell, Share2, Trash2, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import VoiceSettingsCard from '../components/VoiceSettingsCard';
import GuardianSettingsCard from '../components/GuardianSettingsCard';

const AVATARS = [
    { id: 'alucard', name: 'Alucard', path: '/avatars/alucard.glb', gender: 'male', description: 'Guardian of the Night' },
    { id: 'terizla', name: 'Terizla', path: '/avatars/terizla.glb', gender: 'male', description: 'Executioner of Justice' },
    { id: 'lesley', name: 'Lesley', path: '/avatars/lesley.glb', gender: 'female', description: 'Sniper of the Mist' },
    { id: 'novaria', name: 'Novaria', path: '/avatars/novaria.glb', gender: 'female', description: 'Starlight Weaver' }
];

export default function ProfileSettings() {
    const { user, selectedAvatar, setSelectedAvatar, settings, setSettings } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('identity'); // identity | sentinel | privacy

    const handleSaveGuardian = (e) => {
        e.preventDefault();
        const email = e.target.guardian_email.value;
        setSettings({ ...settings, guardianEmail: email });
        window.alert(`Guardian link generated for ${email}. (Sentinel active)`);
    };

    if (!user) return (
        <div className="pt-32 flex flex-col items-center justify-center h-[70vh] text-center px-4">
            <div className="w-16 h-16 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <Lock size={28} className="text-gray-600" />
            </div>
            <h2 className="text-3xl font-black tracking-tight mb-2">Connect Identity</h2>
            <p className="text-gray-500 mb-8 font-medium max-w-xs leading-relaxed">
                Your neural profile is currently secured. Connect your account to manage your future personas.
            </p>
            <button 
                onClick={() => setIsAuthOpen(true)}
                className="px-10 py-4 bg-white text-dark font-black tracking-widest uppercase rounded-2xl text-[10px] transition-all hover:scale-105 shadow-xl"
            >
                Connect account
            </button>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-4xl mx-auto pt-24 pb-20 px-4"
        >
            <div className="flex flex-col md:flex-row gap-12">
                
                {/* Sidebar Navigation */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                            <User className="text-neon" size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-tighter">Your Identity</h2>
                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Profile Hub</p>
                        </div>
                    </div>

                    <div className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0 scrollbar-hide">
                        {[
                            { id: 'identity', label: 'Core Persona', icon: <User size={18} /> },
                            { id: 'sentinel', label: 'Sentinel Mode', icon: <Shield size={18} /> },
                            { id: 'privacy', label: 'Quantum Privacy', icon: <Lock size={18} /> }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-white/10 text-white border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1">
                    <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] border border-white/5 relative overflow-hidden min-h-[500px]">
                        
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
                            <User size={300} />
                        </div>

                        {activeTab === 'identity' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <h3 className="text-3xl font-black tracking-tighter mb-4 italic">Core Persona</h3>
                                <p className="text-xs text-gray-500 font-medium mb-10 leading-relaxed max-w-lg">
                                    Choose your 3D neural avatar. This choice synchronizes your future self's appearance and voice gender.
                                </p>
                                
                                <div className="space-y-10">
                                    {/* Avatar Grid */}
                                    <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
                                        {AVATARS.map((av) => (
                                            <button
                                                key={av.id}
                                                onClick={() => setSelectedAvatar(av)}
                                                className={`relative p-1 rounded-[2rem] transition-all group ${selectedAvatar.id === av.id ? 'ring-2 ring-neon' : 'hover:ring-1 hover:ring-white/20'}`}
                                            >
                                                <div className="glass-panel p-6 rounded-[2rem] h-full text-left bg-white/[0.03] group-hover:bg-white/[0.05] transition-colors">
                                                    <div className="flex items-center gap-3 mb-3">
                                                       <div className={`w-8 h-8 rounded-full flex items-center justify-center ${av.gender === 'male' ? 'bg-blue-500/20' : 'bg-pink-500/20'}`}>
                                                            <User size={14} className={av.gender === 'male' ? 'text-blue-400' : 'text-pink-400'} />
                                                       </div>
                                                       <span className="text-xs font-black uppercase tracking-widest text-white">{av.name}</span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{av.description}</p>
                                                    
                                                    {selectedAvatar.id === av.id && (
                                                        <div className="absolute top-6 right-6">
                                                            <div className="w-5 h-5 bg-neon rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(0,255,204,0.5)]">
                                                                <CheckCircle2 size={12} className="text-dark" strokeWidth={3} />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Voice Settings Section */}
                                    <div className="pt-6 border-t border-white/5">
                                        <VoiceSettingsCard />
                                    </div>

                                    {/* Details */}
                                    <div className="pt-10 border-t border-white/10">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-2 block">Display Persona</label>
                                        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-gray-400 font-mono text-sm leading-none flex items-center justify-between">
                                            {user.email || user.name}
                                            <Lock size={12} className="opacity-30" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'sentinel' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <GuardianSettingsCard />
                            </motion.div>
                        )}

                        {activeTab === 'privacy' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <h3 className="text-3xl font-black tracking-tighter mb-8 italic">Quantum Privacy</h3>
                                
                                <div className="space-y-8">
                                    <div className="p-8 rounded-[2rem] bg-emerald-950/20 border border-emerald-500/20">
                                        <div className="flex items-center gap-3 mb-4">
                                            <CheckCircle2 className="text-emerald-400" size={24} />
                                            <h4 className="text-lg font-black tracking-tight text-emerald-300">Local Sovereignty</h4>
                                        </div>
                                        <p className="text-sm text-emerald-500/80 leading-relaxed font-medium mb-6">
                                            Your 3D neural avatar data is stored locally and never leaves your browser. We don't process external images or use third-party avatar generators like ReadyPlayerMe.
                                        </p>
                                        <button className="text-[10px] font-black uppercase tracking-widest text-emerald-400 hover:text-white transition-colors">READ THE PRIVACY MANIFESTO <ChevronRight className="inline" size={14} /></button>
                                    </div>

                                    <div className="p-8 rounded-[2rem] bg-white/3 border border-white/5 opacity-50 grayscale hover:grayscale-0 transition-all cursor-not-allowed group">
                                        <h4 className="text-lg font-black tracking-tight mb-2 flex items-center justify-between">
                                            End-to-End Encryption
                                            <span className="text-[8px] px-2 py-1 bg-white/10 rounded-full">Coming Soon</span>
                                        </h4>
                                        <p className="text-xs text-gray-500 font-medium leading-relaxed">
                                            Secure your chat history with locally-held keys. Only you (and your future selves) will ever know what was said.
                                        </p>
                                    </div>

                                    <div className="pt-10 border-t border-white/5 space-y-4">
                                        <button className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-red-500/60 hover:text-red-500 transition-all">
                                            <Trash2 size={16} /> Delete All AI Predictions & History
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
