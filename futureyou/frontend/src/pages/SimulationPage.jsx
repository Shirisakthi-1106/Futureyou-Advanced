import { useContext, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppContext } from '../context/AppContext';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, AlertTriangle, Sparkles, ArrowRight, Brain, Activity, Heart, LayoutDashboard } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

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

const DataMissingFallback = () => (
    <div className="h-[70vh] flex flex-col items-center justify-center text-center px-4 pt-32">
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-6 text-gray-500">
            <Brain size={40} className="opacity-20" />
        </div>
        <h2 className="text-3xl font-black tracking-tighter mb-4">Neural Data Missing</h2>
        <p className="text-gray-400 max-w-sm mb-8 font-medium">We haven't projected your timeline yet. Complete the form to initialize your future simulation.</p>
        <Link to="/" className="px-10 py-4 bg-neon text-dark font-black tracking-widest uppercase rounded-2xl text-[10px] transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2">
            Initialize Timeline <ArrowRight size={14} />
        </Link>
    </div>
);

export default function SimulationPage() {
    const { predictions, trajectory, habits } = useContext(AppContext);
    
    const maxYear = trajectory?.current?.length ? trajectory.current.length - 1 : 5;
    const [activeYear, setActiveYear] = useState(maxYear);

    // --- Optimized Data Calculations ---
    const chartData = useMemo(() => {
        if (!trajectory || !trajectory.current) return [];
        return trajectory.current.map((pt, i) => ({
            year: i === 0 ? 'Now' : `Yr ${i}`,
            burnout: trajectory.declining[i]?.exam_score || 0,
            optimized: trajectory.optimized[i]?.exam_score || 0,
            current: pt.exam_score,
            burnout_stress: trajectory.declining[i]?.stress_pct || 0,
            optimized_stress: trajectory.optimized[i]?.stress_pct || 0,
            burnout_wb: trajectory.declining[i]?.wellbeing_score || 0,
            optimized_wb: trajectory.optimized[i]?.wellbeing_score || 0,
        }));
    }, [trajectory]);

    const activeDeltas = useMemo(() => {
        const safeActiveYear = Math.min(activeYear, (trajectory?.current?.length || 1) - 1);
        const burnoutYear = trajectory?.declining?.[safeActiveYear];
        const optimizedYear = trajectory?.optimized?.[safeActiveYear];
        
        if (!burnoutYear || !optimizedYear) return null;

        return {
            exam: optimizedYear.exam_score - burnoutYear.exam_score,
            stress: burnoutYear.stress_pct - optimizedYear.stress_pct,
            wb: optimizedYear.wellbeing_score - burnoutYear.wellbeing_score,
            burnoutState: burnoutYear.stress_pct > 70 ? 'Burnout Crisis' : burnoutYear.stress_pct > 50 ? 'Struggling' : 'Declining',
            optimizedState: optimizedYear.exam_score > 75 ? 'Thriving' : optimizedYear.exam_score > 60 ? 'Growing' : 'Recovering',
            burnoutYear,
            optimizedYear
        };
    }, [trajectory, activeYear]);

    const availableYears = useMemo(() => {
        if (!trajectory || !trajectory.current) return [];
        return Array.from({ length: trajectory.current.length - 1 }, (_, i) => i + 1);
    }, [trajectory]);

    // STABILITY: Remove forced Navigate, use Fallback instead
    if (!predictions || !trajectory || !activeDeltas) {
        return <DataMissingFallback />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto pt-24 pb-20 px-4"
        >
            <div className="fixed inset-0 -z-50 pointer-events-none">
                <div className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-red-950/10 to-transparent"></div>
                <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-emerald-950/10 to-transparent"></div>
            </div>

            <div className="text-center mb-12">
                <span className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[10px] font-black uppercase tracking-[0.3em] text-neon mb-6 inline-block">
                    Multiverse Simulator
                </span>
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                    Two Futures.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-white to-emerald-400">One Choice.</span>
                </h1>
                <p className="text-gray-400 text-sm max-w-xl mx-auto">
                    Comparing your life in {activeYear} year{activeYear !== 1 ? 's' : ''} based on your decisions starting today.
                </p>
            </div>

            <div className="flex justify-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-hide">
                {availableYears.map(y => (
                    <button
                        key={y}
                        onClick={() => setActiveYear(y)}
                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${activeYear === y ? 'bg-white text-dark border-white' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/30'}`}
                    >
                        Year {y}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-10">
                {/* BURNOUT SIDE */}
                <div className="glass-panel rounded-[2rem] overflow-hidden border border-red-500/10 bg-red-950/5">
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500">Continuing Path</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tighter text-red-200 mb-1">{activeDeltas.burnoutState}</h2>
                        <p className="text-xs text-red-500/60">If current habits remain unchanged...</p>
                    </div>
                    <div className="px-8 pb-8 grid grid-cols-3 gap-4">
                        <StatCard label="Exam Score" value={activeDeltas.burnoutYear.exam_score.toFixed(0)} color={BURNOUT_COLOR} />
                        <StatCard label="Stress" value={`${activeDeltas.burnoutYear.stress_pct.toFixed(0)}%`} color="#ff3366" />
                        <StatCard label="Wellbeing" value={activeDeltas.burnoutYear.wellbeing_score.toFixed(1)} color="#ff9966" />
                    </div>
                    <div className="px-4 h-[120px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="burnoutGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ff3366" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#ff3366" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="year" fontSize={9} tick={{ fill: '#444' }} />
                                <Area type="monotone" dataKey="burnout" stroke={BURNOUT_COLOR} strokeWidth={2} fill="url(#burnoutGrad)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="px-8 py-6 bg-red-500/5 mt-4">
                        <p className="text-[10px] text-red-400/80 leading-relaxed font-bold">
                            {activeDeltas.burnoutYear.dropout_prob > 30 
                                ? `CRITICAL: Dropout risk elevated to ${activeDeltas.burnoutYear.dropout_prob.toFixed(1)}%.` 
                                : `WARNING: Cognitive burnout likely due to ${activeDeltas.burnoutYear.stress_pct.toFixed(0)}% stress load.`}
                        </p>
                    </div>
                </div>

                {/* OPTIMIZED SIDE */}
                <div className="glass-panel rounded-[2rem] overflow-hidden border border-emerald-500/10 bg-emerald-950/5">
                    <div className="p-8">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-2 h-2 rounded-full bg-neon animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neon">Optimized Path</span>
                        </div>
                        <h2 className="text-2xl font-black tracking-tighter text-emerald-200 mb-1">{activeDeltas.optimizedState}</h2>
                        <p className="text-xs text-emerald-500/60">If corrective habits start today...</p>
                    </div>
                    <div className="px-8 pb-8 grid grid-cols-3 gap-4">
                        <StatCard label="Exam Score" value={activeDeltas.optimizedYear.exam_score.toFixed(0)} color={OPTIMIZED_COLOR} />
                        <StatCard label="Stress" value={`${activeDeltas.optimizedYear.stress_pct.toFixed(0)}%`} color="#00ffcc" />
                        <StatCard label="Wellbeing" value={activeDeltas.optimizedYear.wellbeing_score.toFixed(1)} color="#00ffcc" />
                    </div>
                    <div className="px-4 h-[120px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="optimizedGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#00ffcc" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#00ffcc" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                                <XAxis dataKey="year" fontSize={9} tick={{ fill: '#444' }} />
                                <Area type="monotone" dataKey="optimized" stroke={OPTIMIZED_COLOR} strokeWidth={2} fill="url(#optimizedGrad)" isAnimationActive={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="px-8 py-6 bg-emerald-500/5 mt-4">
                        <p className="text-[10px] text-emerald-400 font-bold leading-relaxed">
                            {activeDeltas.optimizedYear.exam_score > 80 
                                ? "EXCELLENCE: Academic trajectory stabilized in the top 5th percentile." 
                                : "STABLE: Sustainable growth with low dropout liability."}
                        </p>
                    </div>
                </div>
            </div>

            <div className="glass-panel rounded-[2rem] p-8 border border-white/5">
                <h3 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-8">Delta Analysis (Year {activeYear} Impact)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { label: 'Academic Performance Gap', value: `+${activeDeltas.exam.toFixed(1)} pts`, icon: <Brain size={20} />, color: '#00ffcc' },
                        { label: 'Stress Reduction', value: `-${activeDeltas.stress.toFixed(1)}%`, icon: <Activity size={20} />, color: '#b026ff' },
                        { label: 'Wellbeing Gain', value: `+${activeDeltas.wb.toFixed(1)}/10`, icon: <Heart size={20} />, color: '#00ffcc' },
                    ].map((item, i) => (
                        <div key={i} className="flex flex-col items-center text-center p-6 rounded-2xl bg-white/2 border border-white/5">
                            <div className="mb-3" style={{ color: item.color }}>{item.icon}</div>
                            <div className="text-3xl font-mono font-black mb-1" style={{ color: item.color }}>{item.value}</div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-gray-600">{item.label}</div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="mt-8 flex justify-center">
                 <Link to="/dashboard" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">
                     Explore Detailed Trajectory <LayoutDashboard size={14} />
                 </Link>
            </div>
        </motion.div>
    );
}
