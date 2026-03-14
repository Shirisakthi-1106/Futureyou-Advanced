import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, MessageSquare, Sliders } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function Home() {
    const { user, setIsAuthOpen, habits, setHabits, setPredictions, setTrajectory, setChatHistory } = useContext(AppContext);
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

    const handlePredict = async () => {
        if (!user) {
            setIsAuthOpen(true);
            return;
        }

        setLoading(true);
        try {
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
                years_ahead: Math.round(habits.years_ahead)
            };

            const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/predict`, payload);
            setPredictions(res.data.predictions);
            setTrajectory(res.data.trajectory);

            // Initialize chat implicitly for the future
            const chatRes = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/chat`, {
                user_input: payload,
                message: "Introduce yourself as my future self. Keep it short and impactful.",
                history: []
            });
            setChatHistory([{ role: 'future', content: chatRes.data.reply }]);

            navigate('/dashboard');
        } catch (e) {
            console.error(e);
            window.alert('Simulation Initialization Failed: Could not connect to the timeline server. Ensure the backend FastAPI server is running on port 8000 (uvicorn api:app --reload --port 8000).');
        }
        setLoading(false);
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
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="max-w-5xl mx-auto pt-32 pb-20"
        >
            <div className="text-center mb-16">
                <h1 className="text-6xl font-black tracking-tighter mb-4 bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
                    Define Your <span className="text-neon bg-none">Variables</span>
                </h1>
                <p className="text-gray-400 text-lg">Adjust the sliders to simulate your quantum timeline.</p>
            </div>

            <div className="flex justify-center gap-4 mb-8">
                <button 
                    onClick={() => setInputMode('sliders')}
                    className={`px-6 py-2 rounded-full font-bold text-sm tracking-widest uppercase transition-all flex items-center gap-2 ${inputMode === 'sliders' ? 'bg-neon text-dark shadow-[0_0_20px_rgba(0,255,204,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                    <Sliders size={16} /> Sliders
                </button>
                <button 
                    onClick={() => setInputMode('text')}
                    className={`px-6 py-2 rounded-full font-bold text-sm tracking-widest uppercase transition-all flex items-center gap-2 ${inputMode === 'text' ? 'bg-purple text-white shadow-[0_0_20px_rgba(176,38,255,0.4)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                >
                    <MessageSquare size={16} /> Describe Your Day
                </button>
            </div>

            <div className="glass-panel rounded-[2rem] p-10 relative overflow-hidden z-10 min-h-[400px]">
                <div className="neon-border absolute inset-0 -z-10 rounded-[2rem]"></div>

                {inputMode === 'sliders' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {Object.keys(habits).map((key, i) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                key={key}
                                className="flex flex-col gap-3"
                            >
                                <label className="text-xs font-bold text-purple tracking-widest uppercase">{labels[key]}</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range" min="0" max={maxes[key]} step="0.1"
                                        value={habits[key]} onChange={e => setHabits({ ...habits, [key]: Number(e.target.value) })}
                                        className="w-full accent-neon bg-white/10 rounded-full appearance-none h-1"
                                    />
                                    <span className="text-white font-mono w-8 text-right bg-white/5 py-1 px-2 rounded-md border border-white/10">
                                        {isFloatLabel(key) ? habits[key].toFixed(1) : Math.round(habits[key])}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                ) : (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex flex-col h-full"
                    >
                        <h3 className="text-xl font-bold mb-4">Just tell me about your typical day.</h3>
                        <p className="text-gray-400 mb-6 text-sm">Example: "I usually sleep around 6 hours, try to study for 3 hours, but honestly I spend like 4 hours on TikTok. I hit the gym maybe twice a week. My diet is okay, mental health is a bit stressed, maybe a 6 out of 10."</p>
                        
                        <textarea 
                            value={textInput}
                            onChange={(e) => setTextInput(e.target.value)}
                            placeholder="Describe your habits here..."
                            className="w-full flex-1 min-h-[200px] bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:border-purple focus:ring-1 focus:ring-purple resize-none mb-6"
                        />
                        
                        <div className="flex justify-end">
                            <button 
                                onClick={handleParseText}
                                disabled={parsing || !textInput.trim()}
                                className="px-8 py-3 bg-purple text-white font-bold tracking-widest uppercase rounded-xl text-sm transition-all hover:bg-purple/80 disabled:opacity-50 flex items-center gap-2"
                            >
                                {parsing ? 'Analyzing...' : 'Extract Data'} <Sparkles size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </div>

            <div className="flex justify-center mt-16">
                <motion.button
                    onClick={handlePredict}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-12 py-5 bg-white text-dark font-bold tracking-widest uppercase rounded-full text-sm shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all flex items-center gap-3 hover:shadow-[0_0_50px_rgba(0,255,204,0.6)] hover:text-neon"
                >
                    {loading ? 'Initializing Simulation...' : 'Generate Trajectory'} <ArrowRight size={18} />
                </motion.button>
            </div>
        </motion.div>
    );
}
