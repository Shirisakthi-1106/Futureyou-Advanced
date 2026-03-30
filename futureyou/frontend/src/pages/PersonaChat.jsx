import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, User, Zap, TrendingDown } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

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
You know your current stats exactly:
- Sleep: ${user_input?.sleep_hours}h, Study: ${user_input?.study_hours}h, Social Media: ${user_input?.social_media_hours}h
- ML Prediction: Exam Score ${predictions?.exam_score}, Stress ${predictions?.stress_pct}%, Wellbeing ${predictions?.wellbeing_score}/10
Speak in first person ("I", "my") as if you are the user RIGHT NOW. Be direct, factual, and slightly defensive. 
You know things are not perfect. You're aware but haven't changed yet. Max 120 words.
`,
    },
    {
        id: 'future',
        label: 'Future You',
        subtitle: 'Optimized · 5 Years On',
        color: '#00ffcc',
        glowColor: 'rgba(0,255,204,0.2)',
        borderColor: 'border-neon/30',
        bgColor: 'bg-neon/5',
        icon: <Sparkles size={18} />,
        systemPrompt: (user_input, predictions, trajectory) => {
            const optimized5yr = trajectory?.optimized?.[5];
            return `
You are the OPTIMIZED FUTURE SELF of the user, speaking from 5 years ahead.
You FIXED your habits. You went from ${user_input?.sleep_hours}h sleep to 8h, 
from ${user_input?.study_hours}h study to structured 6h blocks.
Your current stats (5 years from now): Exam Score ${optimized5yr?.exam_score}, 
Stress ${optimized5yr?.stress_pct}%, Wellbeing ${optimized5yr?.wellbeing_score}/10.
Speak warmly but specifically. You're proud but empathetic. Reference the exact journey. Max 120 words.
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
            const declining5yr = trajectory?.declining?.[5];
            return `
You are the BURNOUT SELF of the user — 5 years in the future where nothing changed.
Sleep stayed at ${user_input?.sleep_hours}h, stress kept rising, motivation collapsed.
Your current stats: Exam Score ${declining5yr?.exam_score}, 
Stress ${declining5yr?.stress_pct}%, Wellbeing ${declining5yr?.wellbeing_score}/10.
Speak with exhaustion and regret. You're not angry — just tired and honest. 
Warn them, but don't lecture. Be real. Max 120 words.
`;
        },
    },
];

export default function PersonaChat() {
    const { user, predictions, habits, trajectory } = useContext(AppContext);
    const [activePersona, setActivePersona] = useState('future');
    const [chatsByPersona, setChatsByPersona] = useState({ present: [], future: [], burnout: [] });
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatsByPersona, loading]);

    if (!user || !predictions) return <Navigate to="/" />;

    const persona = PERSONAS.find(p => p.id === activePersona);
    const currentChat = chatsByPersona[activePersona];

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
                `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/persona-chat`,
                {
                    persona_id: activePersona,
                    system_prompt: systemPrompt,
                    message: input,
                    history: currentChat,
                    user_input: habits,
                }
            );
            const reply = { role: 'persona', content: response.data.reply };
            setChatsByPersona(prev => ({
                ...prev,
                [activePersona]: [...newHistory, reply]
            }));
        } catch (err) {
            console.error(err);
            setChatsByPersona(prev => ({
                ...prev,
                [activePersona]: [...newHistory, { role: 'persona', content: 'Connection issue. Make sure the backend is running.' }]
            }));
        }
        setLoading(false);
    };

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col h-[calc(100vh-80px)] mt-20 bg-dark w-full relative z-20"
        >
            {/* Ambient glow based on persona */}
            <div
                className="fixed inset-0 -z-10 pointer-events-none transition-all duration-700"
                style={{ background: `radial-gradient(ellipse at 50% 30%, ${persona.glowColor} 0%, transparent 60%)` }}
            />

            {/* Persona Tabs */}
            <div className="flex-shrink-0 border-b border-white/5 bg-dark/80 backdrop-blur-xl">
                <div className="max-w-3xl mx-auto px-4 pt-4 pb-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 mb-3 text-center">Choose Your Self To Speak With</p>
                    <div className="flex gap-2 justify-center">
                        {PERSONAS.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setActivePersona(p.id)}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-t-2xl text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                                    activePersona === p.id
                                        ? `border-b-2 bg-white/5`
                                        : 'border-transparent text-gray-500 hover:text-gray-300'
                                }`}
                                style={activePersona === p.id ? { borderColor: p.color, color: p.color } : {}}
                            >
                                <span style={activePersona === p.id ? { color: p.color } : {}}>{p.icon}</span>
                                <span className="hidden sm:inline">{p.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Active Persona Header */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activePersona}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex-shrink-0 py-4 px-4 text-center"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
                        <span style={{ color: persona.color }}>{persona.icon}</span>
                        <span className="text-xs font-black" style={{ color: persona.color }}>{persona.label}</span>
                        <span className="text-[10px] text-gray-500">·</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-widest">{persona.subtitle}</span>
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto">
                {currentChat.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4">
                        <div
                            className="w-16 h-16 rounded-full flex items-center justify-center mb-4 border"
                            style={{ backgroundColor: `${persona.color}10`, borderColor: `${persona.color}30` }}
                        >
                            <span style={{ color: persona.color }}>{persona.icon}</span>
                        </div>
                        <h3 className="text-lg font-black mb-2" style={{ color: persona.color }}>{persona.label}</h3>
                        <p className="text-sm text-gray-500 max-w-xs">{persona.subtitle}</p>
                        <p className="text-xs text-gray-600 mt-2">Ask anything. This version of you is listening.</p>
                    </div>
                )}

                <AnimatePresence>
                    {currentChat.map((msg, i) => (
                        <motion.div
                            key={`${activePersona}-${i}`}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`w-full py-5 border-b border-white/5 ${msg.role === 'user' ? '' : 'bg-white/[0.02]'}`}
                        >
                            <div className="max-w-3xl mx-auto px-4 flex gap-4">
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border`}
                                    style={msg.role === 'persona'
                                        ? { backgroundColor: `${persona.color}15`, borderColor: `${persona.color}40`, color: persona.color }
                                        : { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: '#9ca3af' }
                                    }
                                >
                                    {msg.role === 'user' ? <User size={14} /> : persona.icon}
                                </div>
                                <div className="flex-1 pt-0.5">
                                    <div className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: msg.role === 'persona' ? persona.color : '#6b7280' }}>
                                        {msg.role === 'user' ? 'You' : persona.label}
                                    </div>
                                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {loading && (
                    <div className="w-full py-5 bg-white/[0.02]">
                        <div className="max-w-3xl mx-auto px-4 flex gap-4">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: `${persona.color}15`, color: persona.color }}>
                                {persona.icon}
                            </div>
                            <div className="flex items-center gap-1 pt-2">
                                {[0, 1, 2].map(d => (
                                    <span key={d} className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: persona.color, animationDelay: `${d * 150}ms` }}></span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input */}
            <div className="flex-shrink-0 p-4 border-t border-white/5 bg-dark/80 backdrop-blur-xl">
                <form onSubmit={handleSend} className="max-w-3xl mx-auto">
                    <div
                        className="flex items-center gap-2 bg-white/5 rounded-2xl p-2 border transition-all"
                        style={{ borderColor: `${persona.color}30` }}
                    >
                        <input
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            placeholder={`Ask ${persona.label} anything...`}
                            className="flex-1 bg-transparent border-none pl-4 py-2 text-white focus:outline-none text-sm placeholder-gray-600"
                        />
                        <button
                            type="submit"
                            disabled={loading || !input.trim()}
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-dark transition-all hover:scale-105 disabled:opacity-40"
                            style={{ backgroundColor: persona.color }}
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </form>
            </div>
        </motion.div>
    );
}
