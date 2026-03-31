import { useContext, useState } from 'react';
import { AppContext } from '../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertCircle, CheckCircle, Info, Mail, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function SentinelStatusCard() {
    const { predictions, settings } = useContext(AppContext);
    const [expanded, setExpanded] = useState(false);
    
    const sentinel = predictions?.sentinel; 

    if (!settings.sentinelEnabled) return (
        <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center justify-between opacity-50 grayscale hover:grayscale-0 transition-all cursor-help">
            <div className="flex items-center gap-4">
                <Shield size={20} className="text-gray-500" />
                <div>
                    <h4 className="text-sm font-black uppercase tracking-tight">Sentinel System: Standby</h4>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Intervention Mode Disabled</p>
                </div>
            </div>
            <Info size={16} className="text-gray-700" />
        </div>
    );

    if (!sentinel) return null;

    const isRisk = sentinel.triggered;
    const severity = sentinel.severity;
    
    const colors = {
        low: 'text-green-400 border-green-500/20 bg-green-500/5',
        medium: 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5',
        high: 'text-orange-400 border-orange-500/20 bg-orange-500/5',
        critical: 'text-red-400 border-red-500/20 bg-red-500/5'
    };

    const alertDetails = sentinel.alert_details;
    const hasAlertError = alertDetails?.error;
    const sentCount = alertDetails?.sent_to?.length || 0;
    const failCount = alertDetails?.failed?.length || 0;
    const trajSummary = sentinel.trajectory_summary || {};
    const suggestions = sentinel.recovery_suggestions || [];

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-6 rounded-3xl border shadow-2xl relative overflow-hidden ${isRisk ? colors[severity] : 'text-neon border-neon/20 bg-neon/5'}`}
        >
            {isRisk && (
                <div className="absolute top-0 right-0 p-4 animate-pulse opacity-20">
                    <AlertCircle size={60} />
                </div>
            )}

            <div className="flex flex-col gap-4 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${isRisk ? 'bg-black/20' : 'bg-neon/10 border-neon/20'}`}>
                            {isRisk ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="text-lg font-black uppercase tracking-tight italic">
                                    Sentinel: {isRisk ? `${severity.toUpperCase()} RISK DETECTED` : 'Optimal Trajectory'}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[8px] font-black uppercase tracking-widest text-gray-400">
                                    Neural Link: Automatic
                                </span>
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                                {isRisk ? 'Proactive Intervention Protocols Active' : 'Neural Link Stability: High • Monitoring for Disruption'}
                            </p>
                            
                            {/* Alert delivery status */}
                            {sentinel.alert_sent && sentCount > 0 && (
                                <p className="text-[9px] font-black uppercase tracking-widest text-green-400 mt-1 flex items-center gap-1.5">
                                    <Mail size={10} /> Alert sent to {sentCount} guardian(s) • {new Date().toLocaleTimeString()}
                                </p>
                            )}
                            {sentinel.alert_sent && failCount > 0 && (
                                <p className="text-[9px] font-black uppercase tracking-widest text-yellow-400 mt-1 flex items-center gap-1.5">
                                    <AlertTriangle size={10} /> {failCount} delivery failure(s): {alertDetails.failed.join(', ')}
                                </p>
                            )}
                            {hasAlertError && !sentinel.alert_sent && (
                                <p className="text-[9px] font-black uppercase tracking-widest text-red-400 mt-1 flex items-center gap-1.5">
                                    <AlertTriangle size={10} /> Email failed: {alertDetails.error}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Expand button if there's risk data */}
                    {isRisk && (sentinel.reasons?.length > 0 || suggestions.length > 0) && (
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/20 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-black/30 transition-all self-start md:self-center"
                        >
                            {expanded ? 'Collapse' : 'Details'}
                            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                        </button>
                    )}
                </div>

                {/* Reason chips — always visible */}
                <div className="flex flex-wrap gap-2">
                    {sentinel.reasons?.slice(0, expanded ? undefined : 3).map((reason, i) => (
                        <span key={i} className="px-3 py-1 rounded-full bg-black/20 border border-white/5 text-[9px] font-black uppercase tracking-widest">
                            {reason}
                        </span>
                    ))}
                    {!expanded && sentinel.reasons?.length > 3 && (
                        <span className="px-3 py-1 rounded-full bg-black/10 border border-white/5 text-[9px] font-bold uppercase tracking-widest text-gray-500 cursor-pointer"
                              onClick={() => setExpanded(true)}>
                            +{sentinel.reasons.length - 3} more
                        </span>
                    )}
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                    {expanded && isRisk && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                {/* Trajectory Summary */}
                                {Object.keys(trajSummary).length > 0 && (
                                    <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                                        <h5 className="text-[9px] font-black uppercase tracking-widest mb-3 opacity-60">Trajectory Projection</h5>
                                        <div className="grid grid-cols-3 gap-3 text-center">
                                            <div>
                                                <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Drift</p>
                                                <p className="text-lg font-mono font-black text-red-400">{trajSummary.drift_path_exam || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Current</p>
                                                <p className="text-lg font-mono font-black text-yellow-400">{trajSummary.current_path_exam || '—'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] uppercase tracking-widest opacity-40 mb-1">Thriving</p>
                                                <p className="text-lg font-mono font-black text-green-400">{trajSummary.thriving_path_exam || '—'}</p>
                                            </div>
                                        </div>
                                        {trajSummary.exam_gap && (
                                            <p className="text-[9px] text-center mt-2 opacity-50">
                                                Recovery gap: <strong>{trajSummary.exam_gap} points</strong>
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* Recovery Suggestions */}
                                {suggestions.length > 0 && (
                                    <div className="p-4 rounded-2xl bg-black/20 border border-white/5">
                                        <h5 className="text-[9px] font-black uppercase tracking-widest mb-3 opacity-60">Recovery Actions</h5>
                                        <ul className="space-y-1.5">
                                            {suggestions.map((s, i) => (
                                                <li key={i} className="text-[10px] font-medium opacity-70 flex items-start gap-2">
                                                    <span className="text-green-400 mt-0.5">•</span>
                                                    {s}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}
