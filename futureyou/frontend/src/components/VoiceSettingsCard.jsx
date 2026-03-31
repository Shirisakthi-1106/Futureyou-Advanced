import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Volume2, VolumeX, Ghost, User, UserPlus } from 'lucide-react';

export default function VoiceSettingsCard() {
    const { settings, setSettings } = useContext(AppContext);

    const updateVoice = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    return (
        <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Volume2 className="text-indigo-400" size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight italic">Avatar Vocal Core</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Neural Synthesis Control</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Voice Enable Toggle */}
                <div className="flex items-center justify-between p-4 rounded-3xl bg-white/3 border border-white/5">
                    <div className="flex items-center gap-3">
                        {settings.voiceEnabled ? <Volume2 size={18} className="text-indigo-400" /> : <VolumeX size={18} className="text-gray-600" />}
                        <span className="text-sm font-bold uppercase tracking-wider">Voice Feedback</span>
                    </div>
                    <button
                        onClick={() => updateVoice('voiceEnabled', !settings.voiceEnabled)}
                        className={`w-12 h-6 rounded-full transition-all relative ${settings.voiceEnabled ? 'bg-indigo-500' : 'bg-gray-800'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.voiceEnabled ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>

                {/* Autoplay Toggle */}
                <div className="flex items-center justify-between p-4 rounded-3xl bg-white/3 border border-white/5">
                    <div className="flex items-center gap-3">
                        <Ghost size={18} className="text-indigo-400" />
                        <span className="text-sm font-bold uppercase tracking-wider">Autoplay Response</span>
                    </div>
                    <button
                        onClick={() => updateVoice('voiceAutoplay', !settings.voiceAutoplay)}
                        className={`w-12 h-6 rounded-full transition-all relative ${settings.voiceAutoplay ? 'bg-indigo-500' : 'bg-gray-800'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.voiceAutoplay ? 'right-1' : 'left-1'}`} />
                    </button>
                </div>

                {/* Voice Gender Selection */}
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Vocal Identity Override</label>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: 'auto', label: 'Auto Match', icon: <Ghost size={14} /> },
                            { id: 'male', label: 'Masculine', icon: <User size={14} /> },
                            { id: 'female', label: 'Feminine', icon: <UserPlus size={14} /> },
                            { id: 'neutral', label: 'Neutral', icon: <User size={14} /> }
                        ].map(v => (
                            <button
                                key={v.id}
                                onClick={() => updateVoice('voiceGender', v.id)}
                                className={`flex items-center justify-center gap-2 p-3 rounded-2xl text-[10px] font-black uppercase transition-all border ${
                                    settings.voiceGender === v.id 
                                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                                        : 'bg-white/3 border-white/10 text-gray-500 hover:border-white/20'
                                }`}
                            >
                                {v.icon}
                                {v.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
