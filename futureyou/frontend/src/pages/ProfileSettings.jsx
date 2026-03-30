import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { User, Shield, Bell, Share2, Camera, Trash2, CheckCircle2, ChevronRight, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ProfileSettings() {
    const { user, avatarUrl, setAvatarUrl, settings, setSettings } = useContext(AppContext);
    const [activeTab, setActiveTab] = useState('identity'); // identity | sentinel | privacy

    const handleSaveGuardian = (e) => {
        e.preventDefault();
        const email = e.target.guardian_email.value;
        setSettings({ ...settings, guardianEmail: email });
        window.alert(`Guardian link generated for ${email}. (Sentinel active)`);
    };

    if (!user) return (
        <div className="pt-32 flex flex-col items-center justify-center h-[70vh]">
            <Lock size={48} className="text-gray-600 mb-4" />
            <h2 className="text-2xl font-black">Login Required</h2>
            <p className="text-gray-500 mb-6 font-medium">Please connect your account to manage your profile.</p>
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
                                <h3 className="text-3xl font-black tracking-tighter mb-8 italic">Core Persona</h3>
                                
                                <div className="space-y-10">
                                    {/* Avatar Section */}
                                    <div className="flex flex-col sm:flex-row items-center gap-8">
                                        <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden relative group">
                                            {avatarUrl ? (
                                                <img src={`https://models.readyplayer.me/${avatarUrl.split('/').pop()}.png`} className="w-full h-full object-cover" />
                                            ) : (
                                                <User className="text-gray-600" size={32} />
                                            )}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                                <Camera size={20} className="text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 text-center sm:text-left">
                                            <h4 className="text-lg font-black tracking-tighter mb-2">3D Neural Avatar</h4>
                                            <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-sm mb-4">
                                                Generated from your profile to personify your future self during simulations.
                                            </p>
                                            <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                                <button className="px-4 py-2 rounded-xl bg-neon text-dark text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-transform">Update Model</button>
                                                <button onClick={() => setAvatarUrl('')} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">Default</button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-2 block">Link Your Ready Player Me ID</label>
                                            <input 
                                                type="text" 
                                                value={avatarUrl}
                                                onChange={e => setAvatarUrl(e.target.value)}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm focus:outline-none focus:border-neon/50" 
                                                placeholder="https://models.readyplayer.me/id.glb"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600 mb-2 block">Display Persona</label>
                                            <input 
                                                type="text" 
                                                readOnly
                                                value={user.email.split('@')[0]}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-gray-500 font-mono text-sm focus:outline-none" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'sentinel' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <div className="flex items-center gap-3 mb-1">
                                    <h3 className="text-3xl font-black tracking-tighter italic">Sentinel Mode</h3>
                                    <span className="px-2 py-0.5 rounded-full bg-neon/10 text-neon text-[8px] font-black uppercase tracking-widest border border-neon/20">Beta Active</span>
                                </div>
                                <p className="text-xs text-gray-500 font-medium mb-10 leading-relaxed max-w-lg">
                                    Link a Guardian (Parent, Mentor, Partner) who can securely view your trajectory and receive critical intervention alerts.
                                </p>

                                <form onSubmit={handleSaveGuardian} className="space-y-8">
                                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Share2 size={24} className="text-purple-400" />
                                            <div>
                                                <h4 className="text-base font-black tracking-tight">Guardian Integration</h4>
                                                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Connect your sentinel</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                                            <input 
                                                name="guardian_email"
                                                type="email" 
                                                defaultValue={settings.guardianEmail}
                                                className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-mono text-sm focus:outline-none focus:border-neon/50" 
                                                placeholder="parent-email@example.com"
                                            />
                                            <button className="px-8 py-4 rounded-2xl bg-white text-dark text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Send Link</button>
                                        </div>
                                        
                                        {settings.guardianEmail && (
                                            <div className="flex items-center gap-2 mt-4 text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                <CheckCircle2 size={12} className="text-green-400" />
                                                Active Sentinel Link: 
                                                <Link to={`/guardian-portal?user=${user.id}`} target="_blank" className="text-neon hover:underline cursor-pointer">guardian-view/{user.id.slice(0,8)}</Link>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-gray-600">Sentinel Preferences</h4>
                                        {[
                                            { key: 'pushNotifications', label: 'Enable Behavioral Push Alerts', sub: 'Receive prompts when late-night habits are detected.' },
                                            { key: 'sentinelEnabled', label: 'Mirror to Guardian Dashboard', sub: 'Automatically log critical risk events to your Guardian.' }
                                        ].map(pref => (
                                            <div key={pref.key} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/3 transition-colors">
                                                <div>
                                                    <p className="text-sm font-black text-white">{pref.label}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium">{pref.sub}</p>
                                                </div>
                                                <div 
                                                    className={`w-12 h-6 rounded-full relative transition-colors cursor-pointer ${settings[pref.key] ? 'bg-neon' : 'bg-gray-700'}`}
                                                    onClick={() => setSettings({...settings, [pref.key]: !settings[pref.key]})}
                                                >
                                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings[pref.key] ? 'left-7' : 'left-1'}`}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </form>
                            </motion.div>
                        )}

                        {activeTab === 'privacy' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                <h3 className="text-3xl font-black tracking-tighter mb-8 italic">Quantum Privacy</h3>
                                
                                <div className="space-y-8">
                                    <div className="p-8 rounded-[2rem] bg-emerald-950/20 border border-emerald-500/20">
                                        <div className="flex items-center gap-3 mb-4">
                                            <CheckCircle2 className="text-emerald-400" size={24} />
                                            <h4 className="text-lg font-black tracking-tight text-emerald-300">"Photo-Zero" Promise</h4>
                                        </div>
                                        <p className="text-sm text-emerald-500/80 leading-relaxed font-medium mb-6">
                                            Your biometric data never touches our server. When you generate a 3D avatar, the source image is processed client-side and **immediately discarded**. We store only polygon coordinates, never your face.
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
