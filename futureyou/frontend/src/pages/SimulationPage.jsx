import { useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import { Navigate } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertTriangle, Sparkles, ArrowRight, Brain, Activity, Heart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const BURNOUT_COLOR = '#ff3366';
const OPTIMIZED_COLOR = '#00ffcc';

function StatCard({ label, value, color, delta, icon }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-600">{label}</span>
            <div className="flex items-end gap-2">
                <span className="text-2xl font-mono font-black" style={{ color }}>{value}</span>
                {delta !== undefined && (
                    <span className={`text-xs font-bold mb-1 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(1)}
                    </span>
                )}
            </div>
        </div>
    );
}

export default function SimulationPage() {
    const { predictions, trajectory, habits } = useContext(AppContext);
    const [activeYear, setActiveYear] = useState(5);
    const [view, setView] = useState('split'); // 'split' | 'burnout' | 'optimized'

    if (!predictions || !trajectory) return <Navigate to="/" />;

    const burnoutYear = trajectory.declining[activeYear];
    const optimizedYear = trajectory.optimized[activeYear];
    const currentYear = trajectory.current[activeYear];

    const chartData = trajectory.current.map((pt, i) => ({
        year: i === 0 ? 'Now' : `Yr ${i}`,
        burnout: trajectory.declining[i].exam_score,
        optimized: trajectory.optimized[i].exam_score,
        current: pt.exam_score,
        burnout_stress: trajectory.declining[i].stress_pct,
        optimized_stress: trajectory.optimized[i].stress_pct,
        burnout_wb: trajectory.declining[i].wellbeing_score,
        optimized_wb: trajectory.optimized[i].wellbeing_score,
    }));

    const examDelta = optimizedYear.exam_score - burnoutYear.exam_score;
    const stressDelta = burnoutYear.stress_pct - optimizedYear.stress_pct;
    const wbDelta = optimizedYear.wellbeing_score - burnoutYear.wellbeing_score;

    // Narrative labels
    const burnoutState = burnoutYear.stress_pct > 70 ? 'Burnout Crisis' : burnoutYear.stress_pct > 50 ? 'Struggling' : 'Declining';
    const optimizedState = optimizedYear.exam_score > 75 ? 'Thriving' : optimizedYear.exam_score > 60 ? 'Growing' : 'Recovering';

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-7xl mx-auto pt-24 pb-20 px-4"
        >
            {/* Ambient */}
            <div className="fixed inset-0 -z-50 pointer-events-none">
                <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-red-950/20 to-transparent pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-950/20 to-transparent pointer-events-none"></div>
            </div>

            {/* Header */}
            <div className="text-center mb-12">
                <span className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-neon mb-6 inline-block">
                    Multiverse Simulator
                </span>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                    Two Futures.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-white to-emerald-400">One Choice.</span>
                </h1>
                <p className="text-gray-400 text-base max-w-xl mx-auto">
                    This is what your life looks like in {activeYear} year{activeYear !== 1 ? 's' : ''} — depending on what you decide <em>today</em>.
                </p>
            </div>

            {/* Year Selector */}
            <div className="flex justify-center gap-2 mb-10">
                {[1, 2, 3, 4, 5].map(y => (
                    <button
                        key={y}
                        onClick={() => setActiveYear(y)}
                        className={`px-5 py-2 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${activeYear === y ? 'bg-white text-dark border-white' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30'}`}
                    >
                        Year {y}
                    </button>
                ))}
            </div>

            {/* SPLIT VIEW */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">

                {/* BURNOUT SIDE */}
                <motion.div
                    layout
                    className="glass-panel rounded-[2rem] overflow-hidden border border-red-500/20"
                    style={{ boxShadow: '0 0 40px rgba(255,51,102,0.1)' }}
                >
                    <div className="bg-gradient-to-b from-red-950/60 to-transparent p-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-400">Continuing Path</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter text-red-300 mb-1">{burnoutState}</h2>
                        <p className="text-sm text-red-400/70">If your current habits remain unchanged...</p>
                    </div>
                    <div className="px-8 pb-8 grid grid-cols-3 gap-4">
                        <StatCard label="Exam Score" value={`${burnoutYear.exam_score.toFixed(0)}`} color={BURNOUT_COLOR} />
                        <StatCard label="Stress Level" value={`${burnoutYear.stress_pct.toFixed(0)}%`} color="#ff3366" />
                        <StatCard label="Wellbeing" value={burnoutYear.wellbeing_score.toFixed(1)} color="#ff9966" />
                    </div>
                    <div className="px-4 pb-6">
                        <div className="h-[140px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="burnoutGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ff3366" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#ff3366" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#2d1a1f" vertical={false} />
                                    <XAxis dataKey="year" stroke="#6b2d3d" tick={{ fill: '#6b2d3d', fontSize: 10 }} />
                                    <YAxis domain={[0, 100]} stroke="#6b2d3d" tick={{ fill: '#6b2d3d', fontSize: 10 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#1a0a0f', border: '1px solid #ff3366', borderRadius: '12px' }} />
                                    <Area type="monotone" dataKey="burnout" stroke={BURNOUT_COLOR} strokeWidth={2} fill="url(#burnoutGrad)" name="Exam Score" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="px-8 pb-8">
                        <div className="border border-red-500/20 rounded-2xl p-4 bg-red-950/20">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={16} />
                                <div>
                                    <p className="text-xs font-bold text-red-300 mb-1">Projected Outcome</p>
                                    <p className="text-xs text-red-400/80 leading-relaxed">
                                        {burnoutYear.dropout_prob > 30
                                            ? `Dropout risk at ${burnoutYear.dropout_prob}% — academic trajectory in critical decline.`
                                            : burnoutYear.stress_pct > 60
                                            ? `Chronic stress at ${burnoutYear.stress_pct}% — cognitive burnout is imminent.`
                                            : `Performance sliding to ${burnoutYear.exam_score} — below competitive threshold.`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* OPTIMIZED SIDE */}
                <motion.div
                    layout
                    className="glass-panel rounded-[2rem] overflow-hidden border border-emerald-500/20"
                    style={{ boxShadow: '0 0 40px rgba(0,255,204,0.1)' }}
                >
                    <div className="bg-gradient-to-b from-emerald-950/60 to-transparent p-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-3 h-3 rounded-full bg-neon animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon">Optimized Path</span>
                        </div>
                        <h2 className="text-3xl font-black tracking-tighter text-emerald-300 mb-1">{optimizedState}</h2>
                        <p className="text-sm text-emerald-400/70">If you start correcting your habits today...</p>
                    </div>
                    <div className="px-8 pb-8 grid grid-cols-3 gap-4">
                        <StatCard label="Exam Score" value={`${optimizedYear.exam_score.toFixed(0)}`} color={OPTIMIZED_COLOR} />
                        <StatCard label="Stress Level" value={`${optimizedYear.stress_pct.toFixed(0)}%`} color="#00ffcc" />
                        <StatCard label="Wellbeing" value={optimizedYear.wellbeing_score.toFixed(1)} color="#00ffcc" />
                    </div>
                    <div className="px-4 pb-6">
                        <div className="h-[140px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="optimizedGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00ffcc" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#0d2a1f" vertical={false} />
                                    <XAxis dataKey="year" stroke="#1a5c3d" tick={{ fill: '#1a5c3d', fontSize: 10 }} />
                                    <YAxis domain={[0, 100]} stroke="#1a5c3d" tick={{ fill: '#1a5c3d', fontSize: 10 }} />
                                    <Tooltip contentStyle={{ backgroundColor: '#0a1a13', border: '1px solid #00ffcc', borderRadius: '12px' }} />
                                    <Area type="monotone" dataKey="optimized" stroke={OPTIMIZED_COLOR} strokeWidth={2} fill="url(#optimizedGrad)" name="Exam Score" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                    <div className="px-8 pb-8">
                        <div className="border border-emerald-500/20 rounded-2xl p-4 bg-emerald-950/20">
                            <div className="flex items-start gap-3">
                                <Sparkles className="text-neon flex-shrink-0 mt-0.5" size={16} />
                                <div>
                                    <p className="text-xs font-bold text-emerald-300 mb-1">Projected Outcome</p>
                                    <p className="text-xs text-emerald-400/80 leading-relaxed">
                                        {optimizedYear.exam_score > 75
                                            ? `Exam performance reaches ${optimizedYear.exam_score.toFixed(0)} — top-tier academic trajectory.`
                                            : optimizedYear.wellbeing_score > 7
                                            ? `Wellbeing score peaks at ${optimizedYear.wellbeing_score.toFixed(1)} — you feel genuinely fulfilled.`
                                            : `Stress reduced to ${optimizedYear.stress_pct.toFixed(0)}% — sustainable, growing momentum.`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* DELTA IMPACT BANNER */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass-panel rounded-[2rem] p-8 mb-10 border border-white/5"
            >
                <h3 className="text-center text-sm font-black uppercase tracking-[0.3em] text-gray-400 mb-8">
                    The Gap — What Habit Change Is Worth In {activeYear} Year{activeYear !== 1 ? 's' : ''}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Academic Performance Gap', value: `+${examDelta.toFixed(1)} pts`, sub: 'exam score difference', icon: <Brain size={20} />, color: '#00ffcc' },
                        { label: 'Stress Reduction', value: `-${stressDelta.toFixed(1)}%`, sub: 'less chronic stress', icon: <Activity size={20} />, color: '#b026ff' },
                        { label: 'Wellbeing Gain', value: `+${wbDelta.toFixed(1)}/10`, sub: 'overall life quality', icon: <Heart size={20} />, color: '#00ffcc' },
                    ].map((item, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/3 border border-white/5"
                        >
                            <div className="mb-3" style={{ color: item.color }}>{item.icon}</div>
                            <div className="text-4xl font-mono font-black mb-1" style={{ color: item.color }}>{item.value}</div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500">{item.label}</div>
                            <div className="text-xs text-gray-600 mt-1">{item.sub}</div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
