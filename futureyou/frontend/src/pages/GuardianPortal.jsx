import { useEffect, useState, useMemo } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Activity, TrendingUp, TrendingDown, Clock, AlertTriangle, Heart, User, CheckCircle2, ChevronRight } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const BURNOUT_COLOR = '#ff3366';
const OPTIMIZED_COLOR = '#00ffcc';

export default function GuardianPortal() {
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('user');
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    // In a real app, we'd fetch this from the backend by userId
    // For the hackathon demo, we'll "fetch" from localStorage or use dummy data if not found
    useEffect(() => {
        const habits = JSON.parse(localStorage.getItem('futureyou_habits') || '{}');
        const predictions = JSON.parse(localStorage.getItem('futureyou_predictions') || '{}');
        const trajectory = JSON.parse(localStorage.getItem('futureyou_trajectory') || '{}');
        
        if (predictions && trajectory && Object.keys(predictions).length > 0) {
            setUserData({ habits, predictions, trajectory });
        }
        setLoading(false);
    }, [userId]);

    if (!userId) return <Navigate to="/" />;

    if (loading) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-dark">
            <div className="w-16 h-16 rounded-full border-2 border-white/5 border-t-neon animate-spin mb-6"></div>
            <p className="text-xs font-black uppercase tracking-[0.4em] text-gray-500">Decrypting Sentinel Feed</p>
        </div>
    );

    if (!userData) return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-dark px-4 text-center">
            <AlertTriangle size={48} className="text-red-500 mb-4" />
            <h2 className="text-2xl font-black">Sentinel Link Invalid</h2>
            <p className="text-gray-500 max-w-sm mt-2">This guardian link has expired or the user has revoked access.</p>
        </div>
    );

    const { predictions, trajectory, habits } = userData;
    const isCrisis = predictions.stress_pct > 75 || predictions.dropout_prob > 30;

    const radarData = [
        { subject: 'Sleep', A: habits.sleep_hours / 12 * 100, fullMark: 100 },
        { subject: 'Study', A: habits.study_hours / 16 * 100, fullMark: 100 },
        { subject: 'Digital', A: Math.max(0, 100 - (habits.screen_time / 16 * 100)), fullMark: 100 },
        { subject: 'Mood', A: habits.mood_score * 10, fullMark: 100 },
        { subject: 'Diet', A: habits.diet_quality * 50, fullMark: 100 },
        { subject: 'Physical', A: habits.exercise_frequency / 7 * 100, fullMark: 100 },
    ];

    const chartData = trajectory.current.map((pt, i) => ({
        year: i === 0 ? 'Now' : `Yr ${i}`,
        current: pt.exam_score,
        optimized: trajectory.optimized?.[i]?.exam_score || pt.exam_score,
        burnout: trajectory.declining?.[i]?.exam_score || pt.exam_score,
    }));

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-dark pt-24 pb-20 px-4 max-w-6xl mx-auto"
        >
            {/* Header / Badges */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <Shield className="text-neon" size={28} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter">Sentinel Insight</h1>
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                            Guardian Portal <span className="text-gray-800">•</span> Session ID: {userId.slice(0, 8)}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className={`px-4 py-2 rounded-full border flex items-center gap-2 transition-all ${isCrisis ? 'bg-red-500/10 border-red-500/30 text-red-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                        <div className={`w-2 h-2 rounded-full animate-pulse ${isCrisis ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                        <span className="text-[10px] font-black uppercase tracking-widest">{isCrisis ? 'CRITICAL INTERVENTION' : 'SYSTEMS STABLE'}</span>
                    </div>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                
                {/* User Snapshot */}
                <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-white/2">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                            <User className="text-gray-400" size={20} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-600">User Profile</p>
                            <h2 className="text-xl font-black tracking-tight">{userId.slice(0, 12)}</h2>
                        </div>
                    </div>

                    <div className="space-y-6 mb-10">
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 uppercase font-black tracking-widest">Academic Projection</span>
                            <span className="text-2xl font-mono font-black text-neon">{predictions.exam_score.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 uppercase font-black tracking-widest">Current Stress Level</span>
                            <span className={`text-2xl font-mono font-black ${predictions.stress_pct > 70 ? 'text-red-400' : 'text-purple'}`}>{predictions.stress_pct.toFixed(0)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-xs text-gray-500 uppercase font-black tracking-widest">Dropout Liability</span>
                            <span className={`text-2xl font-mono font-black ${predictions.dropout_prob > 30 ? 'text-red-400' : 'text-white'}`}>{predictions.dropout_prob.toFixed(1)}%</span>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/3 border border-white/5">
                        <div className="flex items-start gap-3">
                            <Heart className={isCrisis ? 'text-red-400' : 'text-neon'} size={16} />
                            <p className="text-xs text-gray-400 leading-relaxed font-medium">
                                {isCrisis 
                                    ? "This user is currently in a high-risk stress bracket. Strategic intervention is advised."
                                    : "User behavioral patterns are within normal sustainable ranges."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Radar Chart (Balance) */}
                <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 lg:col-span-1 min-h-[400px]">
                    <h3 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8 underline decoration-neon/30 underline-offset-8">Intervention Radar</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                                <PolarGrid stroke="#ffffff15" />
                                <PolarAngleAxis dataKey="subject" tick={{ fill: "#6b7280", fontSize: 9, fontWeight: 900 }} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                                <Radar name="Habit Strength" dataKey="A" stroke="#00ffcc" fill="#00ffcc" fillOpacity={0.15} />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-[9px] text-center text-gray-600 mt-4 font-black uppercase tracking-widest italic">Closer to edge = Stronger Habit</p>
                </div>

                {/* Sentinel Logs */}
                <div className="glass-panel p-8 rounded-[2.5rem] border border-white/5 bg-white/1">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6 flex items-center justify-between">
                        Sentinel Feed
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                    </h3>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {[
                            { time: '2:14 AM', event: 'Excessive Digital Screen Activity', type: 'warning' },
                            { time: 'Yesterday', event: 'Sleep Cycle Disruption Detected', type: 'alert' },
                            { time: '2 days ago', event: 'Critical Exam Stress Prediction', type: 'critical' },
                            { time: 'Current', event: 'Steady State: No active alerts', type: 'stable' }
                        ].map((log, i) => (
                            <div key={i} className="flex gap-4 p-4 rounded-2xl bg-black/20 border border-white/5">
                                <div className={`w-1 h-8 rounded-full flex-shrink-0 ${log.type === 'critical' ? 'bg-red-500' : log.type === 'alert' ? 'bg-orange-500' : log.type === 'stable' ? 'bg-emerald-500' : 'bg-purple-400'}`}></div>
                                <div>
                                    <p className="text-[10px] text-gray-600 font-bold mb-1 uppercase">{log.time}</p>
                                    <p className="text-xs font-bold text-gray-300">{log.event}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Trajectory Analysis */}
            <div className="glass-panel p-10 rounded-[3rem] border border-white/5">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter mb-2 italic">Future Path Simulation</h3>
                        <p className="text-xs text-gray-500 font-medium max-w-sm">
                            Visualization of the gap between total abandonment of habits and proactive correction.
                        </p>
                    </div>
                    <div className="flex gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-neon"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Optimized</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-400"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Continuing</span>
                        </div>
                    </div>
                </div>

                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorOpt" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={OPTIMIZED_COLOR} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={OPTIMIZED_COLOR} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorBurn" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={BURNOUT_COLOR} stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={BURNOUT_COLOR} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                            <XAxis dataKey="year" stroke="#4b5563" tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 900 }} />
                            <YAxis domain={[0, 100]} stroke="#4b5563" tick={{ fill: "#6b7280", fontSize: 10, fontWeight: 900 }} />
                            <Tooltip contentStyle={{ backgroundColor: "#111", border: "1px solid #ffffff10", borderRadius: "12px" }} />
                            <Area type="monotone" dataKey="optimized" stroke={OPTIMIZED_COLOR} strokeWidth={3} fillOpacity={1} fill="url(#colorOpt)" />
                            <Area type="monotone" dataKey="burnout" stroke={BURNOUT_COLOR} strokeWidth={3} fillOpacity={1} fill="url(#colorBurn)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="text-center mt-12">
                <button className="px-6 py-3 rounded-full bg-white/5 border border-white/10 text-gray-500 text-[10px] font-black uppercase tracking-widest hover:text-white transition-all">
                    Download Full Behavioral Audit Report
                </button>
            </div>
        </motion.div>
    );
}
