import { useContext, useState, useRef, useEffect } from 'react';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Send, User, Sparkles } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

export default function Chat() {
    const { user, predictions, habits, chatHistory, setChatHistory } = useContext(AppContext);
    const [chatInput, setChatInput] = useState('');
    const [chatLoading, setChatLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [chatHistory, chatLoading]);

    if (!user || !predictions) {
        return <Navigate to="/" />;
    }

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
            setChatHistory([...newHistory, { role: 'future', content: chatRes.data.reply }]);
        } catch (e) {
            console.error(e);
            window.alert('Failed to send message. Make sure api.py is running on port 8000.');
        }
        setChatLoading(false);
    };

    return (
        <div className="flex flex-col h-screen pt-20 pb-0 bg-dark w-full absolute inset-0 z-20">
            <div className="flex-1 overflow-y-auto custom-scrollbar w-full">
                {chatHistory.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-50">
                        <Sparkles size={48} className="text-neon mb-4" />
                        <h2 className="text-2xl font-bold tracking-widest text-white uppercase">Initialize Neural Link</h2>
                        <p className="text-gray-400 max-w-md mt-2">Send a message to speak to your future self.</p>
                    </div>
                )}

                {chatHistory.map((msg, i) => (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i}
                        className={`w-full py-8 border-b border-white/5 ${msg.role === 'user' ? 'bg-transparent' : 'bg-white/[0.02]'}`}
                    >
                        <div className="max-w-4xl mx-auto px-6 flex gap-6">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-700' : 'bg-neon/20 border border-neon/50 shadow-[0_0_10px_rgba(0,255,204,0.3)]'}`}>
                                {msg.role === 'user' ? <User size={16} className="text-white" /> : <Sparkles size={16} className="text-neon" />}
                            </div>
                            <div className="flex-1 text-gray-200 leading-relaxed text-lg pt-1 whitespace-pre-wrap">
                                {msg.content}
                            </div>
                        </div>
                    </motion.div>
                ))}

                {chatLoading && (
                    <div className="w-full py-8 bg-white/[0.02]">
                        <div className="max-w-4xl mx-auto px-6 flex gap-6">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-neon/20 border border-neon/50 shadow-[0_0_10px_rgba(0,255,204,0.3)]">
                                <Sparkles size={16} className="text-neon" />
                            </div>
                            <div className="flex-1 text-neon/70 leading-relaxed text-lg pt-1 animate-pulse flex gap-1">
                                <span className="w-2 h-2 rounded-full bg-neon/70 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-neon/70 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 rounded-full bg-neon/70 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </div>

            <div className="w-full bg-gradient-to-t from-dark via-dark to-transparent pt-6 pb-8 px-6 mt-auto">
                <div className="max-w-4xl mx-auto relative">
                    <form onSubmit={handleChat}>
                        <div className="relative flex items-center w-full bg-[#12121a]/80 border border-white/10 rounded-[2rem] p-2 focus-within:border-neon focus-within:ring-1 focus-within:ring-neon/50 transition-all shadow-2xl backdrop-blur-md group hover:border-white/20">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                placeholder="Message Future You..."
                                className="flex-1 bg-transparent border-none pl-6 pr-2 py-3 text-white focus:outline-none focus:ring-0 text-lg placeholder:text-gray-500 w-full"
                            />
                            <button
                                disabled={chatLoading}
                                type="submit"
                                className="bg-neon text-dark h-12 w-12 flex-shrink-0 rounded-full hover:bg-white transition-transform duration-300 hover:scale-105 flex items-center justify-center disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-neon ml-2 mr-1 shadow-[0_0_15px_rgba(0,255,204,0.3)]"
                            >
                                <Send size={20} className="-ml-1" />
                            </button>
                        </div>
                    </form>
                    <div className="text-center mt-3 text-xs text-gray-500">
                        Future You can make mistakes. Consider verifying important timeline details.
                    </div>
                </div>
            </div>
        </div>
    );
}
