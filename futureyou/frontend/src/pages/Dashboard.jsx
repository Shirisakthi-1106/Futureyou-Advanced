import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Brain, Activity, Clock, Sparkles, CheckCircle2, User } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import AvatarCreatorModal from '../components/AvatarCreatorModal';
import Timeline from '../components/Timeline';
import RecoveryPlan from '../components/RecoveryPlan';
import useSentinelNotifications from '../lib/useSentinelNotifications';

export default function Dashboard() {
    const { user, predictions, habits, trajectory, quests, avatarUrl, setAvatarUrl } = useContext(AppContext);
    
    // Initialize Sentinel Notifications
    useSentinelNotifications(user, predictions, habits);

    const [isCreatorOpen, setIsCreatorOpen] = useState(false);
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-6xl mx-auto pt-24 pb-20 px-4"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                    <div className="h-[2px] w-12 bg-neon"></div>
                    <h2 className="text-3xl md:text-4xl font-black tracking-tighter">Your Trajectory</h2>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-neon animate-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Live Simulation Active</span>
                </div>
            </div>

            {/* NEW: Habit Quests Section */}
            {quests && quests.length > 0 && (
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <Sparkles className="text-neon" size={24} />
                        <h2 className="text-xl font-bold tracking-tighter">Active Optimization Quests</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {quests.map((quest, i) => (
                            <motion.div
                                key={quest.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ scale: 1.02 }}
                                className="glass-panel p-6 rounded-2xl border border-neon/20 bg-neon/5 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Brain size={80} className="text-neon" />
                                </div>
                                <div className="flex flex-col h-full z-10 relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="px-3 py-1 rounded-full bg-neon text-dark text-[10px] font-black uppercase tracking-widest">
                                            {quest.impact_level} Impact
                                        </span>
                                        <div className="text-neon">
                                            <Sparkles size={20} />
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-bold mb-1">{quest.title}</h4>
                                    <p className="text-sm text-gray-400 mb-4">{quest.action}</p>
                                    <div className="mt-auto pt-4 border-t border-white/10">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500 uppercase tracking-tighter">Potential Gain</span>
                                            <span className="text-neon font-mono font-bold">{quest.impact}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    
                    {/* NEW: Recovery Plan integration */}
                    <RecoveryPlan quests={quests} predictions={predictions} />
                </div>
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: "Academic Projection", val: predictions.exam_score.toFixed(1), icon: <Brain size={28} />, color: "text-neon", glow: "shadow-[0_0_20px_rgba(0,255,204,0.2)]" },
                    { label: "Dropout Risk", val: predictions.dropout_prob.toFixed(1) + "%", color: predictions.dropout_prob > 20 ? "text-red-400" : "text-neon", icon: <Activity size={28} />, glow: predictions.dropout_prob > 20 ? "shadow-[0_0_20px_rgba(239,68,68,0.2)]" : "shadow-[0_0_20px_rgba(0,255,204,0.2)]" },
                    { label: "Stress Level", val: predictions.stress_pct.toFixed(1) + "%", color: predictions.stress_pct > 50 ? "text-red-400" : "text-purple", icon: <Clock size={28} />, glow: "shadow-[0_0_20px_rgba(176,38,255,0.2)]" },
                    { label: "Overall Wellbeing", val: predictions.wellbeing_score.toFixed(1), color: "text-green-400", icon: <Sparkles size={28} />, glow: "shadow-[0_0_20px_rgba(74,222,128,0.2)]" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        whileHover={{ y: -5 }}
                        className={`glass-panel p-8 rounded-[2.5rem] flex flex-col items-center text-center gap-4 group transition-all duration-300 ${stat.glow}`}
                    >
                        <div className={`p-5 rounded-3xl bg-white/5 ${stat.color} group-hover:scale-110 transition-transform duration-500`}>{stat.icon}</div>
                        <div>
                            <h3 className="text-5xl font-mono font-black tracking-tighter mb-2 italic">{stat.val}</h3>
                            <p className="text-[10px] tracking-[0.2em] font-black text-gray-500 uppercase">{stat.label}</p>
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
                    className="glass-panel p-8 md:p-10 rounded-[2.5rem] mb-12 border border-neon/10"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <Sparkles className="text-neon" size={24} />
                        <h3 className="text-xl font-black tracking-tighter">Neural Insights (Model Explainability)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: "Academic Performance", data: predictions.insights.exam },
                            { title: "Dropout Risk", data: predictions.insights.dropout },
                            { title: "Stress level", data: predictions.insights.stress }
                        ].map((model, idx) => (
                            <div key={idx} className="bg-white/3 rounded-2xl p-6 border border-white/5 hover:border-white/10 transition-colors">
                                <h4 className="text-[10px] font-black tracking-[0.2em] text-gray-500 uppercase mb-5">{model.title}</h4>
                                <div className="flex flex-col gap-4">
                                    {model.data?.map((insight, i) => (
                                        <div key={i} className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400 capitalize text-xs font-medium">{insight.feature.replace(/_/g, ' ')}</span>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-1 w-8 rounded-full ${insight.direction === 'positive' ? 'bg-green-400/20' : 'bg-red-400/20'}`}>
                                                    <div 
                                                        className={`h-full rounded-full ${insight.direction === 'positive' ? 'bg-green-400' : 'bg-red-400'}`} 
                                                        style={{ width: `${Math.min(100, insight.impact * 5)}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`font-mono font-bold text-xs ${insight.direction === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {insight.direction === 'positive' ? '+' : '-'}{insight.impact.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {(!model.data || model.data.length === 0) && <p className="text-xs text-gray-600 italic">Static or background variables only.</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Timeline: The Path Ahead */}
            {timeline && timeline.length > 0 && <Timeline milestones={timeline} />}

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

            {/* Custom Avatar Row */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.75 }}
                className="glass-panel p-8 rounded-[2rem] mt-8"
            >
                <AvatarCreatorModal
                    isOpen={isCreatorOpen}
                    onClose={() => setIsCreatorOpen(false)}
                    onAvatarCreated={(url) => {
                        setAvatarUrl(url);
                    }}
                />

                <div className="flex items-center gap-3 mb-6">
                    <User className="text-neon" size={24} />
                    <h3 className="text-xl font-bold tracking-tighter">Initialize Your Neural Link (Custom Avatar)</h3>
                </div>
                <p className="text-sm text-gray-400 mb-6">Want to see your own face in the "Future You Chat"? Create a free 3D avatar of yourself right here inside the app!</p>
                
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                    <div className="flex-1 w-full relative">
                        <label className="block text-xs uppercase tracking-widest text-gray-500 mb-2">Your Ready Player Me GLB URL</label>
                        <input type="url" value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon" placeholder="No custom avatar linked yet. Click 'Create' to start." />
                    </div>
                    
                    <button 
                        onClick={() => setIsCreatorOpen(true)}
                        className="h-[50px] px-8 bg-neon text-dark font-bold rounded-xl hover:bg-white transition-colors whitespace-nowrap shadow-[0_0_15px_rgba(0,255,204,0.3)] mt-6 sm:mt-0"
                    >
                        {avatarUrl ? 'Update Avatar' : 'Create In-App Avatar'}
                    </button>
                    
                    {/* NEW: Local File Upload Fallback */}
                    <label className="h-[50px] px-6 bg-white/5 text-gray-300 font-bold rounded-xl hover:bg-white/10 transition-colors whitespace-nowrap border border-white/10 cursor-pointer flex items-center mt-6 sm:mt-0">
                        Upload .GLB Output
                        <input 
                            type="file" 
                            accept=".glb" 
                            className="hidden" 
                            onChange={(e) => {
                                const file = e.target.files[0];
                                if (file) {
                                    const objectUrl = URL.createObjectURL(file);
                                    setAvatarUrl(objectUrl);
                                }
                            }}
                        />
                    </label>

                    {avatarUrl && (
                         <button onClick={() => setAvatarUrl('')} className="h-[50px] px-6 bg-red-500/10 text-red-400 font-bold rounded-xl border border-red-500/20 hover:bg-red-500/20 transition-colors mt-6 sm:mt-0">Clear Link</button>
                    )}
                </div>
            </motion.div>

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
