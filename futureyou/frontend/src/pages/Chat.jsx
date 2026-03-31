import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Sparkles, Binary, Volume2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import FutureAvatarPanel from '../components/FutureAvatarPanel';
import { useAvatarVoice } from '../lib/useAvatarVoice';

const DataMissingFallback = () => (
    <div className="h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-32">
        <div className="w-16 h-16 rounded-full bg-neon/5 border border-neon/20 flex items-center justify-center mb-6 text-neon opacity-40">
            <Sparkles size={32} />
        </div>
        <h2 className="text-2xl font-black mb-3">Neural Link Offline</h2>
        <p className="text-gray-500 max-w-sm mb-8 font-medium italic">Your future self is currently out of range. Initialize your unique timeline to establish the uplink.</p>
        <Link to="/" className="px-8 py-3 bg-neon text-dark font-black tracking-widest uppercase rounded-full text-[10px] transition-all hover:scale-105 active:scale-95 shadow-lg">
            Project Future Now
        </Link>
    </div>
);

export default function Chat() {
    const { user, predictions, habits, chatHistory, setChatHistory, selectedAvatar, settings } = useContext(AppContext);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const { isSpeaking, playVoice, stopVoice } = useAvatarVoice();
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatHistory, chatLoading]);

    if (!user || !predictions) return <DataMissingFallback />;

    const handleChat = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || !predictions) return;

        const newHistory = [...chatHistory, { role: 'user', content: chatInput }];
        setChatHistory(newHistory);
        const currentMessage = chatInput;
        setChatInput('');
        setChatLoading(true);

        try {
            const payload = {
                user_id: user.id,
                ...habits,
                sleep_hours: Number(habits.sleep_hours),
                study_hours: Number(habits.study_hours),
                screen_time: Number(habits.screen_time),
                social_media_hours: Number(habits.social_media_hours),
                exercise_frequency: Math.round(habits.exercise_frequency),
                mood_score: Math.round(habits.mood_score),
                diet_quality: Math.round(habits.diet_quality),
                mental_health_rating: Math.round(habits.mental_health_rating),
                years_ahead: Math.round(habits.years_ahead)
            };

            const chatRes = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/chat`, {
                user_input: payload,
                message: currentMessage,
                history: newHistory.slice(0, -1)
            });
            const reply = chatRes.data.reply;
            setChatHistory([...newHistory, { role: 'future', content: reply }]);
            if (settings.voiceAutoplay) {
                playVoice(reply, 'future');
            }
        } catch (e) {
            console.error(e);
            window.alert('Failed to send message. Make sure api.py is running on port 8000.');
        }
        setChatLoading(false);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-[100vh] pt-20 overflow-hidden bg-dark text-white flex flex-col"
        >
            <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col md:flex-row p-4 md:p-8 gap-6 md:gap-10 h-full overflow-hidden">
                
                {/* Desktop Left Column: Chat Interface */}
                <div className="flex-1 flex flex-col h-full bg-white/[0.02] border border-white/5 rounded-[2.5rem] relative shadow-2xl overflow-hidden order-2 md:order-1">
                    
                    {/* Chat Header */}
                    <div className="flex-shrink-0 px-8 py-6 border-b border-white/5 bg-white/3 flex items-center justify-between">
                         <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-2xl bg-neon/10 border border-neon/30 flex items-center justify-center">
                                 <Binary className="text-neon" size={20} />
                             </div>
                             <div>
                                 <h2 className="text-xl font-black tracking-tighter uppercase italic">Neural Uplink</h2>
                                 <div className="flex items-center gap-1.5 pt-0.5">
                                     <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse"></div>
                                     <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Secure Protocol v9.4</span>
                                 </div>
                             </div>
                         </div>
                    </div>

                    {/* Messages Scroll Area */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8">
                        <AnimatePresence mode="popLayout">
                            {chatHistory.length === 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="h-full flex flex-col items-center justify-center text-center opacity-30 select-none pb-20"
                                >
                                    <Sparkles size={64} className="text-neon mb-6 opacity-50" strokeWidth={1} />
                                    <h3 className="text-2xl font-black uppercase tracking-[0.2em] italic mb-3">Initialize Connection</h3>
                                    <p className="text-sm font-medium max-w-sm">Neural self-reflection active. Choose a query to project your future self's perspective.</p>
                                </motion.div>
                            )}

                            {chatHistory.map((msg, i) => (
                                <motion.div
                                    layout
                                    initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    key={i}
                                    className={`flex gap-6 max-w-4xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse text-right' : 'mr-auto'}`}
                                >
                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border ${msg.role === 'user' ? 'bg-white/5 border-white/10' : 'bg-neon/10 border-neon/30 shadow-[0_0_20px_rgba(0,255,204,0.15)]'}`}>
                                        {msg.role === 'user' ? <User size={18} className="text-gray-400" /> : <Sparkles size={18} className="text-neon" />}
                                    </div>
                                    <div className={`p-6 rounded-[2rem] text-base md:text-lg leading-relaxed relative group/msg ${msg.role === 'user' ? 'bg-white/5 border border-white/10 text-gray-200' : 'bg-white/[0.04] border border-white/5 text-neon shadow-lg'}`}>
                                        {msg.content}
                                        {msg.role === 'future' && (
                                            <button 
                                                onClick={() => playVoice(msg.content, 'future')}
                                                className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/5 border border-white/10 opacity-0 group-hover/msg:opacity-100 transition-opacity hover:bg-neon hover:text-dark text-gray-400"
                                            >
                                                <Volume2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {chatLoading && (
                            <div className="flex gap-6 mr-auto group">
                                <div className="w-10 h-10 rounded-2xl bg-neon/10 border border-neon/30 flex items-center justify-center flex-shrink-0 animate-pulse">
                                    <Sparkles size={18} className="text-neon" />
                                </div>
                                <div className="flex items-center gap-2 px-6 py-4 rounded-3xl bg-white/[0.04] border border-white/5">
                                    <span className="w-2 h-2 rounded-full bg-neon/40 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                    <span className="w-2 h-2 rounded-full bg-neon/40 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                    <span className="w-2 h-2 rounded-full bg-neon/40 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} className="h-4" />
                    </div>

                    {/* Chat Input Docked at bottom */}
                    <div className="flex-shrink-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
                        <form onSubmit={handleChat} className="relative group">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="Quantum query to future self..."
                                className="w-full bg-[#12121a]/80 border border-white/10 rounded-[2.5rem] pl-8 pr-16 py-5 text-white active:outline-none focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon/30 transition-all text-lg placeholder:text-gray-600 shadow-2xl backdrop-blur-md"
                            />
                            <button
                                disabled={chatLoading}
                                type="submit"
                                className="absolute right-3 top-1/2 -translate-y-1/2 bg-neon text-dark h-12 w-12 rounded-full hover:scale-105 transition-all flex items-center justify-center disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,204,0.4)]"
                            >
                                <Send size={20} className="-mr-1" />
                            </button>
                        </form>
                    </div>
                </div>

                {/* Desktop Right Column: Fixed Avatar Panel */}
                <div className="w-full md:w-[380px] lg:w-[450px] h-[500px] md:h-full flex-shrink-0 order-1 md:order-2">
                    <div className="sticky top-0 h-full">
                        <FutureAvatarPanel isSpeaking={isSpeaking} predictions={predictions} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
