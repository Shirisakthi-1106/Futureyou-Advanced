import { useContext, useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Brain, Activity, Clock, Sparkles, User, Zap } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { Link } from 'react-router-dom';
import axios from 'axios';
import useSentinelNotifications from '../lib/useSentinelNotifications';
import DashboardSkeleton from '../components/DashboardSkeleton';

// Lazy Load Heavy Components
const Timeline = lazy(() => import('../components/Timeline'));
const RecoveryPlan = lazy(() => import('../components/RecoveryPlan'));
const SentinelStatusCard = lazy(() => import('../components/SentinelStatusCard'));

// Lightweight Placeholder for Suspense
const SectionPlaceholder = ({ height = "200px" }) => (
    <div style={{ height }} className="w-full flex items-center justify-center bg-white/5 rounded-[2rem] border border-white/5 animate-pulse">
        <Sparkles className="text-white/10 animate-spin" size={24} />
    </div>
);

export default function Dashboard() {
    const { user, predictions, habits, trajectory, quests, timeline, selectedAvatar } = useContext(AppContext);
    
    // Global Sentinel is now managed in App.jsx for stability.
    // useSentinelNotifications(user, predictions, habits);

    const [actualExamScore, setActualExamScore] = useState('');
    const [actualStressLevel, setActualStressLevel] = useState('');
    const [feedbackStatus, setFeedbackStatus] = useState('idle');

    // --- Data Processing (Memoized for Speed) ---
    const multiverseData = useMemo(() => {
        if (!trajectory || !trajectory.current) return [];
        return trajectory.current.map((pt, i) => ({
            year: i === 0 ? 'Now' : `Year ${pt.year}`,
            current_score: pt.exam_score,
            declining_score: trajectory.declining?.[i]?.exam_score || pt.exam_score,
            optimized_score: trajectory.optimized?.[i]?.exam_score || pt.exam_score,
            current_stress: pt.stress_pct,
            declining_stress: trajectory.declining?.[i]?.stress_pct || pt.stress_pct,
            optimized_stress: trajectory.optimized?.[i]?.stress_pct || pt.stress_pct,
        }));
    }, [trajectory]);

    const radarData = useMemo(() => [
        { subject: 'Sleep', A: (habits.sleep_hours || 0) / 12 * 100, fullMark: 100 },
        { subject: 'Study', A: (habits.study_hours || 0) / 16 * 100, fullMark: 100 },
        { subject: 'Screen', A: Math.max(0, 100 - ((habits.screen_time || 0) / 16 * 100)), fullMark: 100 },
        { subject: 'Mood', A: (habits.mood_score || 0) * 10, fullMark: 100 },
        { subject: 'Diet', A: (habits.diet_quality || 0) * 50, fullMark: 100 },
        { subject: 'Exercise', A: (habits.exercise_frequency || 0) / 7 * 100, fullMark: 100 },
    ], [habits]);

    const timeAllocation = useMemo(() => [
        { name: 'Sleep', value: habits.sleep_hours || 0, color: '#00ffcc' },
        { name: 'Study', value: habits.study_hours || 0, color: '#b026ff' },
        { name: 'Screen', value: habits.screen_time || 0, color: '#ff3366' },
        { name: 'Social', value: habits.social_media_hours || 0, color: '#33ccff' },
        { name: 'Other', value: Math.max(0, 24 - (habits.sleep_hours || 0) - (habits.study_hours || 0) - (habits.screen_time || 0) - (habits.social_media_hours || 0)), color: '#4b5563' }
    ].filter(item => item.value > 0), [habits]);

    const handleFeedbackSubmit = async (e) => {
        e.preventDefault();
        if (!actualExamScore && !actualStressLevel) return;
        setFeedbackStatus('loading');
        try {
            await axios.post(`${import.meta.env.VITE_API_URL || '/api'}/feedback`, {
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

    const [waitTimedOut, setWaitTimedOut] = useState(false);

    // If predictions haven't loaded after 15s, show fallback instead of infinite skeleton
    useEffect(() => {
        if (predictions && trajectory) {
            setWaitTimedOut(false);
            return;
        }
        const timer = setTimeout(() => setWaitTimedOut(true), 15000);
        return () => clearTimeout(timer);
    }, [predictions, trajectory]);

    // --- LOADING STATE ---
    if (!predictions || !trajectory) {
        if (waitTimedOut) {
            return (
                <div className="h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-32">
                    <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-gray-500">
                        <Zap size={40} className="opacity-20" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter mb-4">Trajectory Data Not Found</h2>
                    <p className="text-gray-400 max-w-sm mb-8 font-medium">Your prediction data hasn't loaded yet. Run the simulation first to generate your future trajectory.</p>
                    <Link to="/" className="px-10 py-4 bg-neon text-dark font-black tracking-widest uppercase rounded-2xl text-[10px] transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2">
                        Go to Form <Zap size={14} />
                    </Link>
                </div>
            );
        }
        return <DashboardSkeleton />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
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

            {/* Optimized Card Rendering */}
            <div className="mb-10 min-h-[100px]">
                <Suspense fallback={<SectionPlaceholder height="100px" />}>
                    <SentinelStatusCard />
                </Suspense>
            </div>

            {/* Quests Section - Early Render */}
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
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="glass-panel p-6 rounded-2xl border border-neon/20 bg-neon/5 relative overflow-hidden group"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Brain size={60} className="text-neon" />
                                </div>
                                <div className="flex flex-col h-full z-10 relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="px-3 py-1 rounded-full bg-neon text-dark text-[10px] font-black uppercase tracking-widest">
                                            {quest.impact_level} Impact
                                        </span>
                                        <div className="text-neon">
                                            <Sparkles size={18} />
                                        </div>
                                    </div>
                                    <h4 className="text-base font-bold mb-1">{quest.title}</h4>
                                    <p className="text-xs text-gray-500 mb-4">{quest.action}</p>
                                    <div className="mt-auto pt-4 border-t border-white/10 text-[10px]">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-500 font-bold uppercase">Potential Gain</span>
                                            <span className="text-neon font-mono font-bold">{quest.impact}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                    
                    <Suspense fallback={<div className="h-40 bg-white/5 rounded-3xl mt-12 animate-pulse" />}>
                        <RecoveryPlan quests={quests} predictions={predictions} />
                    </Suspense>
                </div>
            )}

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {[
                    { label: "Academic Projection", val: predictions.exam_score.toFixed(1), icon: <Brain size={24} />, color: "text-neon", glow: "shadow-[0_0_20px_rgba(0,255,204,0.15)]" },
                    { label: "Dropout Risk", val: predictions.dropout_prob.toFixed(1) + "%", color: predictions.dropout_prob > 20 ? "text-red-400" : "text-neon", icon: <Activity size={24} />, glow: predictions.dropout_prob > 20 ? "shadow-[0_0_20px_rgba(239,68,68,0.15)]" : "shadow-[0_0_20px_rgba(0,255,204,0.15)]" },
                    { label: "Stress Level", val: predictions.stress_pct.toFixed(1) + "%", color: predictions.stress_pct > 50 ? "text-red-400" : "text-purple", icon: <Clock size={24} />, glow: "shadow-[0_0_20px_rgba(176,38,255,0.15)]" },
                    { label: "Overall Wellbeing", val: predictions.wellbeing_score.toFixed(1), color: "text-green-400", icon: <Sparkles size={24} />, glow: "shadow-[0_0_20px_rgba(74,222,128,0.15)]" },
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        className={`glass-panel p-6 rounded-[2.5rem] flex flex-col items-center text-center gap-3 transition-all duration-300 ${stat.glow}`}
                    >
                        <div className={`p-4 rounded-2xl bg-white/5 ${stat.color}`}>{stat.icon}</div>
                        <div>
                            <h3 className="text-4xl font-mono font-black tracking-tighter mb-1 italic">{stat.val}</h3>
                            <p className="text-[9px] tracking-[0.2em] font-black text-gray-500 uppercase">{stat.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Explainable AI Row */}
            {predictions.insights && (
                <div className="glass-panel p-8 md:p-10 rounded-[2.5rem] mb-12 border border-neon/10">
                    <div className="flex items-center gap-3 mb-8">
                        <Sparkles className="text-neon" size={20} />
                        <h3 className="text-xl font-black tracking-tighter">Neural Insights</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { title: "Academic Performance", data: predictions.insights.exam },
                            { title: "Dropout Risk", data: predictions.insights.dropout },
                            { title: "Stress level", data: predictions.insights.stress }
                        ].map((model, idx) => (
                            <div key={idx} className="bg-white/3 rounded-2xl p-5 border border-white/5">
                                <h4 className="text-[9px] font-black tracking-[0.2em] text-gray-600 uppercase mb-4">{model.title}</h4>
                                <div className="flex flex-col gap-3">
                                    {model.data?.map((insight, i) => (
                                        <div key={i} className="flex justify-between items-center text-xs">
                                            <span className="text-gray-500 capitalize">{insight.feature.replace(/_/g, ' ')}</span>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-1 w-6 rounded-full ${insight.direction === 'positive' ? 'bg-green-400/20' : 'bg-red-400/20'}`}>
                                                    <div 
                                                        className={`h-full rounded-full ${insight.direction === 'positive' ? 'bg-green-400' : 'bg-red-400'}`} 
                                                        style={{ width: `${Math.min(100, insight.impact * 5)}%` }}
                                                    ></div>
                                                </div>
                                                <span className={`font-mono font-bold text-[10px] ${insight.direction === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                                                    {insight.direction === 'positive' ? '+' : '-'}{insight.impact.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <Suspense fallback={<SectionPlaceholder height="300px" />}>
                {timeline && timeline.length > 0 && <Timeline milestones={timeline} />}
            </Suspense>

            {/* Multiverse Trajectory Row - Optimized for Speed */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="glass-panel p-8 rounded-[2.2rem] w-full h-[380px] relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black tracking-widest text-gray-500 uppercase">Trajectory: Performance</h3>
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={multiverseData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#232323" vertical={false} />
                            <XAxis dataKey="year" stroke="#4b5563" fontSize={10} />
                            <YAxis domain={[0, 100]} stroke="#4b5563" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#000', borderRadius: '12px', border: '1px solid #333' }} />
                            <Line type="monotone" dataKey="optimized_score" stroke="#00ffcc" strokeWidth={3} dot={false} isAnimationActive={false} />
                            <Line type="monotone" dataKey="current_score" stroke="#ffffff" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.3} dot={false} isAnimationActive={false} />
                            <Line type="monotone" dataKey="declining_score" stroke="#ff3366" strokeWidth={2} opacity={0.7} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-panel p-8 rounded-[2.2rem] w-full h-[380px] relative">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black tracking-widest text-gray-500 uppercase">Trajectory: Stress</h3>
                    </div>
                    <ResponsiveContainer width="100%" height="85%">
                        <LineChart data={multiverseData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#232323" vertical={false} />
                            <XAxis dataKey="year" stroke="#4b5563" fontSize={10} />
                            <YAxis domain={[0, 100]} stroke="#4b5563" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: '#000', borderRadius: '12px', border: '1px solid #333' }} />
                            <Line type="monotone" dataKey="optimized_stress" stroke="#00ffcc" strokeWidth={3} dot={false} isAnimationActive={false} />
                            <Line type="monotone" dataKey="current_stress" stroke="#ffffff" strokeWidth={1.5} strokeDasharray="5 5" opacity={0.3} dot={false} isAnimationActive={false} />
                            <Line type="monotone" dataKey="declining_stress" stroke="#ff3366" strokeWidth={2} opacity={0.7} dot={false} isAnimationActive={false} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Final Stats Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-panel p-8 rounded-[2rem] w-full h-[360px]">
                    <h3 className="text-xs font-bold tracking-widest text-gray-600 uppercase mb-6">Habit Synergy Map</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                            <PolarGrid stroke="#222" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10 }} />
                            <Radar dataKey="A" stroke="#00ffcc" fill="#00ffcc" fillOpacity={0.4} isAnimationActive={false} />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                <div className="glass-panel p-8 rounded-[2rem] w-full h-[360px]">
                    <h3 className="text-xs font-bold tracking-widest text-gray-600 uppercase mb-6">Time Allocation</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={timeAllocation} innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none" isAnimationActive={false}>
                                {timeAllocation.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                            </Pie>
                            <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 10, color: '#666' }} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <Link 
                to="/profile"
                className="block mt-8 glass-panel p-6 rounded-3xl group hover:border-neon/30 transition-all"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                            <User className="text-neon" size={20} />
                        </div>
                        <span className="text-sm font-bold">Neural Identity: {selectedAvatar?.name || 'Default'}</span>
                    </div>
                    <Sparkles className="text-neon group-hover:scale-110 transition-transform" size={18} />
                </div>
            </Link>

            {/* Feedback Row */}
            <div className="glass-panel p-8 rounded-[2.2rem] mt-8">
                <div className="flex items-center gap-3 mb-6">
                    <Brain className="text-neon" size={20} />
                    <h3 className="text-xl font-bold tracking-tighter">Real-World Calibration</h3>
                </div>
                <form onSubmit={handleFeedbackSubmit} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 w-full">
                        <label className="block text-[8px] uppercase tracking-widest text-gray-500 mb-2">Actual Exam Score</label>
                        <input type="number" value={actualExamScore} onChange={e => setActualExamScore(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-neon" placeholder={`Predicted: ${predictions.exam_score.toFixed(1)}`} />
                    </div>
                    <div className="flex-1 w-full">
                        <label className="block text-[8px] uppercase tracking-widest text-gray-500 mb-2">Actual Stress Level (%)</label>
                        <input type="number" value={actualStressLevel} onChange={e => setActualStressLevel(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-neon" placeholder={`Predicted: ${predictions.stress_pct.toFixed(1)}%`} />
                    </div>
                    <button type="submit" disabled={feedbackStatus === 'loading'} className="h-[48px] px-8 bg-neon text-dark font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-white transition-colors disabled:opacity-50">
                        {feedbackStatus === 'loading' ? 'Syncing...' : 'Log Reality'}
                    </button>
                </form>
            </div>
        </motion.div>
    );
}
