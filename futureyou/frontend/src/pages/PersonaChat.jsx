import { useContext, useState, useRef, useEffect, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Zap, TrendingDown, Volume2, Brain } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import FutureAvatarPanel from '../components/FutureAvatarPanel';
import { useAvatarVoice } from '../lib/useAvatarVoice';

const PERSONAS = [
    {
        id: 'present',
        label: 'Present You',
        subtitle: 'Analytical & Aware',
        color: '#ffffff',
        glowColor: 'rgba(255,255,255,0.15)',
        borderColor: 'border-white/20',
        bgColor: 'bg-white/5',
        icon: <User size={18} />,
        systemPrompt: (user_input, predictions) => `
You are the PRESENT SELF of the user. You are self-aware, analytical, and slightly anxious.
Current stats: Sleep ${user_input?.sleep_hours}h, Study ${user_input?.study_hours}h.
Predicted Score: ${predictions?.exam_score}. Speak in first person. Be direct, factual, and slightly defensive. Max 100 words.
`,
    },
    {
        id: 'future',
        label: 'Future You',
        subtitle: 'Optimized Path · 5 Years On',
        color: '#00ffcc',
        glowColor: 'rgba(0,255,204,0.2)',
        borderColor: 'border-neon/30',
        bgColor: 'bg-neon/5',
        icon: <Sparkles size={18} />,
        systemPrompt: (user_input, predictions, trajectory) => {
            const optimized5yr = trajectory?.optimized?.[5] || trajectory?.optimized?.[trajectory.optimized.length - 1];
            return `
You are the OPTIMIZED FUTURE SELF of the user, 5 years ahead.
Stats: Score ${optimized5yr?.exam_score}, Stress ${optimized5yr?.stress_pct}%.
You fixed your habits. Speak warmly but specifically. Max 100 words.
`;
        },
    },
    {
        id: 'burnout',
        label: 'Burnout You',
        subtitle: 'Declining Path · Warning',
        color: '#ff3366',
        glowColor: 'rgba(255,51,102,0.2)',
        borderColor: 'border-red-500/30',
        bgColor: 'bg-red-950/10',
        icon: <TrendingDown size={18} />,
        systemPrompt: (user_input, predictions, trajectory) => {
            const declining5yr = trajectory?.declining?.[5] || trajectory?.declining?.[trajectory.declining.length - 1];
            return `
You are the BURNOUT SELF of the user — 5 years in the future where nothing changed.
Stats: Score ${declining5yr?.exam_score}, Stress ${declining5yr?.stress_pct}%.
Speak with exhaustion and regret. Warn them. Max 100 words.
`;
        },
    },
];

const DataMissingFallback = () => (
    <div className="h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-32">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-gray-500">
            <Brain size={40} className="opacity-20" />
        </div>
        <h2 className="text-3xl font-black tracking-tighter mb-4">Neural Identity Fragmented</h2>
        <p className="text-gray-400 max-w-sm mb-8 font-medium">We haven't projected your multi-persona profiles yet. Complete the form to initialize your conversational simulacra.</p>
        <Link to="/" className="px-10 py-4 bg-neon text-dark font-black tracking-widest uppercase rounded-2xl text-[10px] transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2">
            Initialize Personality Matrix <Zap size={14} />
        </Link>
    </div>
);

export default function PersonaChat() {
    const { user, predictions, habits, trajectory, settings } = useContext(AppContext);
    const [activePersona, setActivePersona] = useState('future');
    const [chatsByPersona, setChatsByPersona] = useState({ present: [], future: [], burnout: [] });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { isSpeaking, playVoice, stopVoice } = useAvatarVoice();

    useEffect(() => {
        stopVoice();
    }, [activePersona, stopVoice]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatsByPersona, loading]);

    // STABILITY: Remove forced redirect
    const persona = useMemo(() => PERSONAS.find(p => p.id === activePersona), [activePersona]);
    const currentChat = useMemo(() => chatsByPersona[activePersona], [chatsByPersona, activePersona]);

    if (!user || !predictions || !trajectory) {
        return <DataMissingFallback />;
    }

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = { role: 'user', content: input };
        const newHistory = [...currentChat, userMsg];
        setChatsByPersona(prev => ({ ...prev, [activePersona]: newHistory }));
        setInput('');
        setLoading(true);

        try {
            const systemPrompt = typeof persona.systemPrompt === 'function'
                ? persona.systemPrompt(habits, predictions, trajectory)
                : persona.systemPrompt;

            const response = await axios.post(
                `${import.meta.env.VITE_API_URL || '/api'}/persona-chat`,
                {
                    persona_id: activePersona,
                    system_prompt: systemPrompt,
                    message: input,
                    history: currentChat,
                    user_input: {
                        user_id: user?.id || 'anonymous',
                        sleep_hours: Number(habits.sleep_hours),
                        study_hours: Number(habits.study_hours),
                        screen_time: Number(habits.screen_time),
                        social_media_hours: Number(habits.social_media_hours),
                        exercise_frequency: Math.round(habits.exercise_frequency),
                        mood_score: Math.round(habits.mood_score),
                        diet_quality: Math.round(habits.diet_quality),
                        mental_health_rating: Math.round(habits.mental_health_rating),
                        years_ahead: Math.round(habits.years_ahead)
                    },
                }
            );
            const reply = { role: 'persona', content: response.data.reply };
            setChatsByPersona(prev => ({
                ...prev,
                [activePersona]: [...newHistory, reply]
            }));

            if (settings.voiceAutoplay) {
                playVoice(reply.content, activePersona);
            }
        } catch (err) {
            console.error(err);
            setChatsByPersona(prev => ({
                ...prev,
                [activePersona]: [...newHistory, { role: 'persona', content: 'Neural link failed. Ensure terminal is active.' }]
            }));
        }
        setLoading(false);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[100vh] pt-20 bg-dark overflow-hidden flex flex-col">
            <div className="max-w-[1500px] mx-auto w-full flex-1 flex flex-col md:flex-row p-4 md:p-8 gap-8 h-full overflow-hidden">
                
                <div className="flex-1 flex flex-col h-full bg-white/[0.01] border border-white/5 rounded-[2.5rem] relative overflow-hidden order-2 md:order-1">
                    <div className="flex-shrink-0 bg-white/2 border-b border-white/5 px-8 pt-4">
                        <div className="flex flex-wrap gap-2 justify-center">
                            {PERSONAS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setActivePersona(p.id)}
                                    className={`px-6 py-4 rounded-t-3xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                        activePersona === p.id ? `bg-white/5 opacity-100` : 'text-gray-600 opacity-60 hover:opacity-100'
                                    }`}
                                    style={activePersona === p.id ? { color: p.color, borderBottom: `2px solid ${p.color}` } : {}}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                        {currentChat.map((msg, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                key={i}
                                className={`flex gap-4 max-w-2xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse text-right' : 'mr-auto'}`}
                            >
                                <div className="p-5 rounded-[2rem] text-sm leading-relaxed relative group bg-white/[0.03] border border-white/5">
                                    {msg.content}
                                    {msg.role === 'persona' && (
                                        <button onClick={() => playVoice(msg.content, activePersona)} className="absolute -right-10 top-1/2 -translate-y-1/2 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-gray-500">
                                            <Volume2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="p-6 bg-gradient-to-t from-black/20 to-transparent">
                        <form onSubmit={handleSend} className="relative">
                            <input
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                placeholder={`Querying ${persona.label.toLowerCase()}...`}
                                className="w-full bg-white/5 border border-white/10 rounded-[2rem] px-8 py-5 pr-16 text-white active:outline-none focus:outline-none focus:border-neon transition-all"
                            />
                            <button
                                type="submit"
                                disabled={loading || !input.trim()}
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-neon text-dark h-12 w-12 rounded-full hover:scale-105 transition-all flex items-center justify-center disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,204,0.4)]"
                            >
                                <Send size={20} className="-mr-1" />
                            </button>
                        </form>
                    </div>
                </div>

                <div className="w-full md:w-[400px] h-[400px] md:h-full flex-shrink-0 order-1 md:order-2">
                    <FutureAvatarPanel isSpeaking={isSpeaking} predictions={predictions} />
                </div>
            </div>
        </motion.div>
    );
}
