import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, MessageSquare, Sliders } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Home() {
    const { user, setIsAuthOpen, habits, setHabits, setPredictions, setTrajectory, setQuests, setTimeline, setChatHistory, settings } = useContext(AppContext);
    const [loading, setLoading] = useState(false);
    const [inputMode, setInputMode] = useState('sliders');
    const [textInput, setTextInput] = useState('');
    const [parsing, setParsing] = useState(false);
    const navigate = useNavigate();

    const handleParseText = async () => {
        if (!textInput.trim()) return;
        setParsing(true);
        try {
            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/parse_input`, { message: textInput });
            const parsed = res.data.parsed;
            setHabits(prev => ({ ...prev, ...parsed }));
            setInputMode('sliders'); // Switch back to let them review
        } catch (e) {
            console.error(e);
            window.alert('Failed to parse text. Please try again or use the sliders.');
        }
        setParsing(false);
    };

    const handlePredict = () => {
        if (!user) {
            setIsAuthOpen(true);
            return;
        }

        setLoading(true);

        // Clean payload for backend (parse floats and round ints)
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
            years_ahead: Math.round(habits.years_ahead),
            // Guardian/Sentinel settings from global state
            guardian_email: settings.guardianEmail,
            guardian_emails: settings.guardianEmails || [],
            guardian_name: settings.guardianName,
            sentinel_enabled: settings.sentinelEnabled
        };

        // NAVIGATE IMMEDIATELY — True non-blocking flow
        navigate('/dashboard');

        // Fire and forget prediction request (it will update context and localStorage when done)
        axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/predict`, payload)
            .then(res => {
                const combinedPredictions = {
                    ...res.data.predictions,
                    sentinel: res.data.sentinel
                };
                setPredictions(combinedPredictions);
                setTrajectory(res.data.trajectory);
                setQuests(res.data.quests || []);
                setTimeline(res.data.timeline || []);

                // PERSIST for session stability
                localStorage.setItem("futureyou_predictions", JSON.stringify(combinedPredictions));
                localStorage.setItem("futureyou_trajectory", JSON.stringify(res.data.trajectory));

                // Then trigger background chat init
                return axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/chat`, {
                    user_input: payload,
                    message: "Introduce yourself as my future self. Keep it short and impactful.",
                    history: []
                });
            })
            .then(chatRes => {
                setChatHistory([{ role: 'future', content: chatRes.data.reply }]);
            })
            .catch(e => {
                console.error("Prediction/Chat Background Failed:", e);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const labels = {
        sleep_hours: "Sleep (hrs)", study_hours: "Study (hrs)", screen_time: "Screen Time",
        social_media_hours: "Social Media", exercise_frequency: "Exercise (days)",
        mood_score: "Mood (1-10)", diet_quality: "Diet (0-2)", mental_health_rating: "Mental Health", years_ahead: "Years Ahead"
    };

    const maxes = {
        sleep_hours: 12, study_hours: 16, screen_time: 16, social_media_hours: 12, exercise_frequency: 7,
        mood_score: 10, diet_quality: 2, mental_health_rating: 10, years_ahead: 10
    };

    // Helper to determine if a variable requires decimals or whole numbers for its display label
    const isFloatLabel = (key) => key.includes('hours') || key === 'screen_time';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-5xl mx-auto pt-24 pb-20 relative px-4"
        >
            {/* Ambient background effect */}
            <div className="fixed inset-0 -z-50 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-neon/10 blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple/10 blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="text-center mb-16 relative">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <span className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-neon mb-6 inline-block">
                        Quantum Trajectory Simulator
                    </span>
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 leading-[0.9]">
                        Design Your <br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon via-white to-purple">Future Self</span>
                    </h1>
                    <p className="text-gray-400 text-base md:text-xl max-w-2xl mx-auto font-medium">
                        Adjust your daily variables to simulate the multiversal path of who you are becoming.
                    </p>
                </motion.div>
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-10">
                <button 
                    onClick={() => setInputMode('sliders')}
                    className={`px-8 py-3 rounded-2xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 border ${inputMode === 'sliders' ? 'bg-neon text-dark border-neon shadow-[0_0_30px_rgba(0,255,204,0.3)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                >
                    <Sliders size={14} /> Modular Inputs
                </button>
                <button 
                    onClick={() => setInputMode('text')}
                    className={`px-8 py-3 rounded-2xl font-black text-xs tracking-widest uppercase transition-all flex items-center justify-center gap-2 border ${inputMode === 'text' ? 'bg-purple text-white border-purple shadow-[0_0_30px_rgba(176,38,255,0.3)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'}`}
                >
                    <MessageSquare size={14} /> Cognitive Extraction
                </button>
            </div>

            <div className="glass-panel rounded-[2.5rem] p-6 md:p-12 relative overflow-hidden backdrop-blur-3xl">
                {inputMode === 'sliders' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-10">
                        {Object.keys(habits).map((key, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 + 0.3 }}
                                key={key}
                                className="flex flex-col gap-4 group"
                            >
                                <div className="flex justify-between items-end">
                                    <label className="text-[10px] font-black text-gray-500 tracking-[0.2em] uppercase group-hover:text-purple transition-colors">{labels[key]}</label>
                                    <span className="text-white font-mono text-sm font-bold bg-white/5 py-1 px-3 rounded-xl border border-white/10 group-hover:border-neon/30 transition-colors">
                                        {isFloatLabel(key) ? habits[key].toFixed(1) : Math.round(habits[key])}
                                    </span>
                                </div>
                                <input
                                    type="range" min="0" max={maxes[key]} step="0.1"
                                    value={habits[key]} onChange={e => setHabits({ ...habits, [key]: Number(e.target.value) })}
                                    className="w-full accent-neon bg-white/10 rounded-full appearance-none h-1.5 cursor-pointer hover:accent-purple transition-all"
                                />
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col h-full min-h-[300px]"
                    >
                        <div className="mb-6">
                             <h3 className="text-xl font-bold mb-2">Narrative Input</h3>
                             <p className="text-gray-400 text-sm">Our AI will extract numerical habits from your natural description.</p>
                        </div>
                        
                        <textarea 
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Example: I sleep 7 hours and study for 5..."
                            className="w-full flex-1 min-h-[200px] bg-white/5 border border-white/10 rounded-[1.5rem] p-6 text-white placeholder-gray-600 focus:outline-none focus:border-purple/50 focus:ring-1 focus:ring-purple/50 resize-none mb-6 font-medium transition-all"
                        />
                        
                        <div className="flex justify-end">
                            <button 
                                onClick={handleParseText}
                                disabled={parsing || !textInput.trim()}
                                className="px-10 py-4 bg-purple text-white font-black tracking-widest uppercase rounded-2xl text-[10px] transition-all hover:scale-105 active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg"
                            >
                                {parsing ? 'Processing Neural Data...' : 'Extract Variables'} <Sparkles size={14} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="flex justify-center mt-12 md:mt-20">
                <motion.button
                    onClick={handlePredict}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="group relative px-10 md:px-16 py-5 md:py-6 bg-white text-dark font-black tracking-[0.2em] uppercase rounded-full text-xs md:text-sm shadow-2xl transition-all flex items-center gap-3 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-neon to-purple opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <span className="relative z-10 group-hover:text-white transition-colors">
                        Generate Future Trajectory
                    </span>
                    <ArrowRight size={18} className="relative z-10 group-hover:text-white transition-transform group-hover:translate-x-2" />
                </motion.button>
            </div>
        </motion.div>
    );
}
