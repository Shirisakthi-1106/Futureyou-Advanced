import { motion } from 'framer-motion';
import { ArrowUp, ArrowRight, CheckCircle2, Clock, Zap, Shield, Moon, Dumbbell, BookOpen, Smartphone } from 'lucide-react';

const FEATURE_ICONS = {
    sleep_hours: <Moon size={18} />,
    study_hours: <BookOpen size={18} />,
    social_media_hours: <Smartphone size={18} />,
    exercise_frequency: <Dumbbell size={18} />,
    screen_time: <Smartphone size={18} />,
    mental_health_rating: <Shield size={18} />,
    mood_score: <Zap size={18} />,
};

const RECOVERY_TEMPLATES = {
    sleep_hours: {
        negative: {
            title: 'Restore Your Sleep Cycle',
            week1: 'Set a fixed bedtime tonight — even 15 min earlier than usual.',
            week2: 'Install Night Mode on all devices. No screens 30 min before bed.',
            week3: 'Target 7.5h of sleep consistently. Track it for 7 days.',
            habit: 'Sleep'
        }
    },
    study_hours: {
        negative: {
            title: 'Rebuild Deep Focus',
            week1: 'Add ONE 45-min Pomodoro session to your day, right after breakfast.',
            week2: 'Block 2h of "deep work" in your calendar. No exceptions.',
            week3: 'Aim for 4+ hours of focused study daily with tracked output.',
            habit: 'Study'
        }
    },
    social_media_hours: {
        negative: {
            title: 'Digital Minimalism Protocol',
            week1: 'Delete YouTube/Instagram from your phone for 7 days.',
            week2: 'Set a 60-min daily hard cap using Screen Time / Digital Wellbeing.',
            week3: 'Replace 1 hour of scroll with a real-world activity. Every day.',
            habit: 'Digital'
        }
    },
    exercise_frequency: {
        negative: {
            title: 'Physical Baseline Reset',
            week1: 'Walk 20 minutes every morning. Non-negotiable.',
            week2: 'Add 2x full-body workouts this week. Any format.',
            week3: 'Maintain 4x exercise sessions per week as your new baseline.',
            habit: 'Exercise'
        }
    },
    screen_time: {
        negative: {
            title: 'Blue Light Detox',
            week1: 'Use blue light glasses after 7 PM. No laptop in bed.',
            week2: 'Reduce total screen time by 2h. Replace with journaling or reading.',
            week3: 'Maintain screen time below 5h/day. Use app blockers if needed.',
            habit: 'Screen'
        }
    },
};

const RANK_COLORS = ['#00ffcc', '#b026ff', '#ff9900', '#33ccff', '#ff3366'];

export default function RecoveryPlan({ quests, predictions }) {
    if (!quests || quests.length === 0) return null;

    // Build recovery items from quests (SHAP-ordered)
    const recoveryItems = quests.map((quest, i) => {
        const feature = quest.id?.split('_')[1] || '';
        const template = RECOVERY_TEMPLATES[feature]?.negative;
        return {
            rank: i + 1,
            title: template?.title || quest.title,
            habit: template?.habit || feature.replace(/_/g, ' '),
            impact: quest.impact,
            impactLevel: quest.impact_level,
            week1: template?.week1 || quest.action,
            week2: template?.week2 || 'Track progress and adjust intensity.',
            week3: template?.week3 || 'Make this habit automatic and sustainable.',
            icon: FEATURE_ICONS[feature] || <Zap size={18} />,
            color: RANK_COLORS[i] || '#ffffff',
        };
    });

    return (
        <div className="mb-12">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-xl bg-neon/10 border border-neon/20">
                    <ArrowUp className="text-neon" size={20} />
                </div>
                <div>
                    <h2 className="text-xl font-black tracking-tighter">Micro Recovery Plan</h2>
                    <p className="text-xs text-gray-500 font-medium">ML-ranked corrective actions — highest impact first</p>
                </div>
            </div>

            <div className="flex flex-col gap-5">
                {recoveryItems.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="glass-panel rounded-[2rem] overflow-hidden group hover:border-white/10 transition-all border border-white/5"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-4 p-6 pb-4">
                            <div
                                className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 font-black text-dark text-sm"
                                style={{ backgroundColor: item.color }}
                            >
                                #{item.rank}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                                        {item.impactLevel} Impact
                                    </span>
                                    <span className="text-[9px] text-gray-600 font-bold">{item.impact}</span>
                                </div>
                                <h3 className="text-base font-black tracking-tight text-white">{item.title}</h3>
                            </div>
                            <div style={{ color: item.color }} className="opacity-50 group-hover:opacity-100 transition-opacity">
                                {item.icon}
                            </div>
                        </div>

                        {/* Timeline Steps */}
                        <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            {[
                                { label: 'Week 1', step: item.week1 },
                                { label: 'Week 2', step: item.week2 },
                                { label: 'Week 3+', step: item.week3 },
                            ].map((s, j) => (
                                <div
                                    key={j}
                                    className="bg-white/3 rounded-2xl p-4 border border-white/5 hover:border-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-dark flex-shrink-0" style={{ backgroundColor: item.color }}>
                                            {j + 1}
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">{s.label}</span>
                                    </div>
                                    <p className="text-xs text-gray-400 leading-relaxed">{s.step}</p>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
