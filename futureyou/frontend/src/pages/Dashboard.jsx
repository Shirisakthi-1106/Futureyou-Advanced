import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Brain, Activity, Clock, Sparkles, CheckCircle2 } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { Navigate } from 'react-router-dom';
import axios from 'axios';

export default function Dashboard() {
    const { user, predictions, habits, trajectory } = useContext(AppContext);
    const [actualExamScore, setActualExamScore] = useState('');
    const [actualStressLevel, setActualStressLevel] = useState('');
    const [feedbackStatus, setFeedbackStatus] = useState('idle'); // idle, loading, success, error

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!actualExamScore && !actualStressLevel) return;
        setFeedbackStatus('loading');
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/feedback`, {
                user_id: user?.id || "anonymous",
                actual_exam_score: actualExamScore ? parseFloat(actualExamScore) : null,
                actual_stress_level: actualStressLevel ? parseFloat(actualStressLevel) : null,
                habits: habits
            });
            setFeedbackStatus('success');
            setTimeout(() => setFeedbackStatus('idle'), 3000);
            setActualExamScore('');
            setActualStressLevel('');
        } catch (error) {
            console.error(error);
            setFeedbackStatus('error');
        }
    };

    if (!predictions || !trajectory) {
        return <Navigate to="/" />;
    }

    // Map the 3 trajectories into a single array for Recharts
    const multiverseData = trajectory.current.map((pt, i) => ({
        year: i === 0 ? 'Now' : `Year ${pt.year}`,
        current_score: pt.exam_score,
        declining_score: trajectory.declining[i].exam_score,
        optimized_score: trajectory.optimized[i].exam_score,
        current_stress: pt.stress_pct,
        declining_stress: trajectory.declining[i].stress_pct,
        optimized_stress: trajectory.optimized[i].stress_pct,
    }));

    const radarData = [
        { subject: 'Sleep', A: habits.sleep_hours / 12 * 100, fullMark: 100 },
        { subject: 'Study', A: habits.study_hours / 16 * 100, fullMark: 100 },
        { subject: 'Screen', A: Math.max(0, 100 - (habits.screen_time / 16 * 100)), fullMark: 100 },
        { subject: 'Mood', A: habits.mood_score * 10, fullMark: 100 },
        { subject: 'Diet', A: habits.diet_quality * 50, fullMark: 100 },
        { subject: 'Exercise', A: habits.exercise_frequency / 7 * 100, fullMark: 100 },
    ];

    const timeAllocation = [
        { name: 'Sleep', value: habits.sleep_hours, color: '#00ffcc' },
        { name: 'Study', value: habits.study_hours, color: '#b026ff' },
        { name: 'Screen', value: habits.screen_time, color: '#ff3366' },
        { name: 'Social', value: habits.social_media_hours, color: '#33ccff' },
        { name: 'Other', value: Math.max(0, 24 - habits.sleep_hours - habits.study_hours - habits.screen_time - habits.social_media_hours), color: '#4b5563' }
    ].filter(item => item.value > 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-6xl mx-auto pt-32 pb-20"
        >
            <div className="flex items-center gap-4 mb-12">
                <div className="h-[2px] w-12 bg-neon"></div>
                <h2 className="text-3xl font-bold tracking-tighter">Your Trajectory</h2>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: "Academic Projection", val: predictions.exam_score.toFixed(1), icon: <Brain size={32} />, color: "text-neon" },
                    { label: "Dropout Risk", val: predictions.dropout_prob.toFixed(1) + "%", color: predictions.dropout_prob > 20 ? "text-red-400" : "text-neon", icon: <Activity size={32} /> },
                    { label: "Stress Level", val: predictions.stress_pct.toFixed(1) + "%", color: predictions.stress_pct > 50 ? "text-red-400" : "text-purple", icon: <Clock size={32} /> },
                    { label: "Overall Wellbeing", val: predictions.wellbeing_score.toFixed(1), color: "text-green-400", icon: <Sparkles size={32} /> },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel p-8 rounded-[2rem] flex flex-col items-center text-center gap-4 group hover:-translate-y-2 transition-transform duration-300"
                    >
                        <div className={`p-4 rounded-full bg-white/5 ${stat.color} shadow-[0_0_20px_inherit] group-hover:scale-110 transition-transform`}>{stat.icon}</div>
                        <div>
                            <h3 className="text-5xl font-mono font-bold tracking-tighter mb-2">{stat.val}</h3>
                            <p className="text-xs tracking-widest text-gray-400 uppercase">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Explainable AI Row */}
            {predictions.insights && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="glass-panel p-8 rounded-[2rem] mb-12"
                >
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="text-neon" size={24} />
                        <h3 className="text-xl font-bold tracking-tighter">AI Insights (Why did I get this prediction?)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: "Academic Performance", data: predictions.insights.exam },
                            { title: "Dropout Risk", data: predictions.insights.dropout },
                            { title: "Stress Level", data: predictions.insights.stress }
                        ].map((model, idx) => (
                            <div key={idx} className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h4 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-4">{model.title} Drivers</h4>
                                <div className="flex flex-col gap-3">
                                    {model.data?.map((insight, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-300 capitalize">{insight.feature.replace(/_/g, ' ')}</span>
                                            <span className={`font-mono font-bold ${insight.direction === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                                                {insight.direction === 'positive' ? '+' : '-'}{insight.impact}%
                                            </span>
                                        </div>
                                    ))}
                                    {(!model.data || model.data.length === 0) && <p className="text-xs text-gray-500">No major factors identified.</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Multiverse Trajectory Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-panel p-8 rounded-[2rem] w-full h-[400px] relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase">Multiverse: Academic Performance</h3>
                        <div className="flex gap-4 text-xs">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#00ffcc]"></div> Optimized</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ffffff] opacity-50"></div> Current</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ff3366]"></div> Declining</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={multiverseData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                            <XAxis dataKey="year" stroke="#4b5563" tick={{ fill: '#4b5563' }} />
                            <YAxis domain={[0, 100]} stroke="#4b5563" tick={{ fill: '#4b5563' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(5, 5, 8, 0.9)', borderRadius: '12px', border: '1px solid #374151', backdropFilter: 'blur(10px)' }} />
                            <Line type="monotone" dataKey="optimized_score" name="Optimized Path" stroke="#00ffcc" strokeWidth={4} dot={{ r: 4, fill: '#00ffcc', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="current_score" name="Current Path" stroke="#ffffff" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#ffffff', strokeWidth: 0 }} opacity={0.5} />
                            <Line type="monotone" dataKey="declining_score" name="Declining Path" stroke="#ff3366" strokeWidth={3} dot={{ r: 3, fill: '#ff3366', strokeWidth: 0 }} opacity={0.8} />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-panel p-8 rounded-[2rem] w-full h-[400px] relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-tl from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase">Multiverse: Stress Forecast</h3>
                        <div className="flex gap-4 text-xs">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#00ffcc]"></div> Optimized</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ffffff] opacity-50"></div> Current</span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#ff3366]"></div> Declining</span>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height="90%">
                        <LineChart data={multiverseData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" vertical={false} />
                            <XAxis dataKey="year" stroke="#4b5563" tick={{ fill: '#4b5563' }} />
                            <YAxis domain={[0, 100]} stroke="#4b5563" tick={{ fill: '#4b5563' }} />
                            <Tooltip contentStyle={{ backgroundColor: 'rgba(5, 5, 8, 0.9)', borderRadius: '12px', border: '1px solid #374151', backdropFilter: 'blur(10px)' }} />
                            <Line type="monotone" dataKey="optimized_stress" name="Optimized Path" stroke="#00ffcc" strokeWidth={4} dot={{ r: 4, fill: '#00ffcc', strokeWidth: 0 }} activeDot={{ r: 8 }} />
                            <Line type="monotone" dataKey="current_stress" name="Current Path" stroke="#ffffff" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#ffffff', strokeWidth: 0 }} opacity={0.5} />
                            <Line type="monotone" dataKey="declining_stress" name="Declining Path" stroke="#ff3366" strokeWidth={3} dot={{ r: 3, fill: '#ff3366', strokeWidth: 0 }} opacity={0.8} />
                        </LineChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Advanced Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 }}
                    className="glass-panel p-8 rounded-[2rem] w-full h-[400px]"
                >
                    <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-8">Habit Synergy Map</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                            <PolarGrid stroke="#374151" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#374151" tick={false} />
                            <Radar name="You" dataKey="A" stroke="#00ffcc" fill="#00ffcc" fillOpacity={0.5} />
                            <Tooltip contentStyle={{ backgroundColor: '#050508', borderRadius: '12px', border: '1px solid #374151', color: '#fff' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="glass-panel p-8 rounded-[2rem] w-full h-[400px]"
                >
                    <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-8">Time Allocation Analysis</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={timeAllocation}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {timeAllocation.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#050508', borderRadius: '12px', border: '1px solid #374151' }} itemStyle={{ color: '#fff' }} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ color: '#9ca3af', fontSize: 12 }} />
                        </PieChart>
                    </ResponsiveContainer>
                </motion.div>
            </div>

            {/* Continuous Fine-Tuning Feedback Row */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="glass-panel p-8 rounded-[2rem] mt-8"
            >
                <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 className="text-neon" size={24} />
                    <h3 className="text-xl font-bold tracking-tighter">Log Today's Reality (Fine-Tune Your Model)</h3>
                </div>
                <p className="text-sm text-gray-400 mb-6">Help your Future Self learn. By logging your actual performance, the machine learning models continuously retrain to provide more accurate trajectories.</p>
                
                <form onSubmit={handleFeedbackSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Actual Exam Score (0-100)</label>
                        <input type="number" min="0" max="100" value={actualExamScore} onChange={e => setActualExamScore(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon" placeholder={`Predicted: ${predictions.exam_score.toFixed(1)}`} />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Actual Stress Level (0-100%)</label>
                        <input type="number" min="0" max="100" value={actualStressLevel} onChange={e => setActualStressLevel(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon" placeholder={`Predicted: ${predictions.stress_pct.toFixed(1)}%`} />
                    </div>
                    <button type="submit" disabled={feedbackStatus === 'loading'} className="h-[50px] px-8 bg-neon text-dark font-bold rounded-xl hover:bg-white transition-colors disabled:opacity-50 whitespace-nowrap">
                        {feedbackStatus === 'loading' ? 'Sending...' : feedbackStatus === 'success' ? 'Logged!' : 'Log Data'}
                    </button>
                </form>
                {feedbackStatus === 'error' && <p className="text-red-400 text-sm mt-3">Failed to log data. Please try again.</p>}
            </motion.div>

        </motion.div>
    );
}
