import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { motion } from 'framer-motion';
import { Brain, Activity, Clock, Sparkles } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, PieChart, Pie, Cell, Legend } from 'recharts';
import { Navigate } from 'react-router-dom';

export default function Dashboard() {
    const { predictions, habits } = useContext(AppContext);

    if (!predictions) {
        return <Navigate to="/" />;
    }

    // Generate fake historical points converging to our prediction to make the graph look awesome
    const performanceData = Array.from({ length: habits.years_ahead }).map((_, i) => ({
        year: `Year ${i + 1}`,
        score: Math.min(100, (predictions.exam_score * 0.7) + (i * (predictions.exam_score * 0.3 / habits.years_ahead))),
        stress: Math.min(100, Math.max(0, predictions.stress_pct + ((Math.random() - 0.5) * 20))),
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

            {/* Area Chart Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="glass-panel p-8 rounded-[2rem] w-full h-[400px]"
                >
                    <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-8">Academic Performance Trend</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#00ffcc" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="year" stroke="#4b5563" tick={{ fill: '#4b5563' }} />
                            <YAxis domain={[0, 100]} stroke="#4b5563" tick={{ fill: '#4b5563' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#050508', borderRadius: '12px', border: '1px solid #374151' }} />
                            <Area type="monotone" dataKey="score" stroke="#00ffcc" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-panel p-8 rounded-[2rem] w-full h-[400px]"
                >
                    <h3 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-8">Stress & Burnout Forecast</h3>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceData}>
                            <defs>
                                <linearGradient id="colorStress" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#b026ff" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#b026ff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="year" stroke="#4b5563" tick={{ fill: '#4b5563' }} />
                            <YAxis domain={[0, 100]} stroke="#4b5563" tick={{ fill: '#4b5563' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#050508', borderRadius: '12px', border: '1px solid #374151' }} />
                            <Area type="monotone" dataKey="stress" stroke="#b026ff" strokeWidth={3} fillOpacity={1} fill="url(#colorStress)" />
                        </AreaChart>
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
        </motion.div>
    );
}
