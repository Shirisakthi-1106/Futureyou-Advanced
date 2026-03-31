import { useContext, useMemo } from 'react';
import { AppContext } from '../context/AppContext';
import AvatarCanvas from './AvatarCanvas';
import { useFutureNotifications } from '../lib/useFutureNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ShieldCheck, Zap, AlertTriangle } from 'lucide-react';

/**
 * FutureAvatarPanel — Premium assistant sidebar/panel that displays the 3D avatar
 * with professional status indicators and glassmorphism.
 */
export default function FutureAvatarPanel({ isSpeaking, predictions }) {
  const { selectedAvatar } = useContext(AppContext);
  const { notification, dismissNotification } = useFutureNotifications(predictions);

  // Derive human-readable status from wellbeing and stress
  const statusInfo = useMemo(() => {
    if (!predictions) return { label: 'SYNCHRONIZING', icon: <Zap size={14} />, color: 'text-blue-400', bg: 'bg-blue-500/10' };
    
    const wellbeing = predictions.wellbeing_score || 5;
    const stress = predictions.stress_pct || 50;

    if (stress > 80) return { label: 'CRITICAL STRESS', icon: <AlertTriangle size={14} />, color: 'text-red-400', bg: 'bg-red-500/10' };
    if (wellbeing >= 8) return { label: 'THRIVING', icon: <ShieldCheck size={14} />, color: 'text-neon', bg: 'bg-neon/10' };
    if (wellbeing >= 5) return { label: 'STABLE', icon: <Activity size={14} />, color: 'text-blue-400', bg: 'bg-blue-500/10' };
    return { label: 'DECLINING', icon: <AlertTriangle size={14} />, color: 'text-orange-400', bg: 'bg-orange-500/10' };
  }, [predictions]);

  return (
    <div className="relative w-full h-[500px] md:h-full lg:min-h-[600px] flex flex-col group overflow-visible">
      {/* Premium Glass Card Wrapper */}
      <div className="absolute inset-0 bg-white/[0.02] border border-white/10 rounded-[2.5rem] backdrop-blur-3xl shadow-2xl overflow-hidden transition-all duration-700 group-hover:border-neon/30">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 pointer-events-none" />
      </div>

      {/* Header / Status Badge */}
      <div className="absolute top-6 left-6 right-6 z-30 flex items-center justify-between pointer-events-none">
        <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mb-1">Projected Identity</span>
            <h4 className="text-sm font-black text-white uppercase tracking-wider">{selectedAvatar?.name || 'Neural Echo'}</h4>
        </div>
        
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 px-3 py-1 rounded-full border border-current/20 font-black text-[9px] tracking-widest ${statusInfo.bg} ${statusInfo.color}`}
        >
            {statusInfo.icon}
            {statusInfo.label}
        </motion.div>
      </div>

      {/* Notifications Overlay */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-10 left-6 right-6 z-40 bg-black/80 backdrop-blur-md border border-white/20 text-white px-5 py-4 rounded-2xl shadow-2xl cursor-pointer"
            onClick={dismissNotification}
          >
            <div className="text-[10px] font-black uppercase tracking-wider mb-1 text-neon/80 border-b border-neon/20 pb-1">
              Neural Alert: {notification.title}
            </div>
            <div className="text-xs font-medium leading-relaxed mt-2 italic opacity-90">
              "{notification.message}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The 3D Render - Positioned for max visibility */}
      <div className="flex-1 w-full relative z-20 pointer-events-auto">
        <AvatarCanvas
          predictions={predictions}
          isSpeaking={isSpeaking}
          isAlerted={!!notification}
          className="cursor-grab active:cursor-grabbing"
        />
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-none opacity-20">
        <span className="text-[8px] font-black uppercase tracking-[0.5em] text-white">Quantum Simulation v4.2</span>
      </div>
    </div>
  );
}
