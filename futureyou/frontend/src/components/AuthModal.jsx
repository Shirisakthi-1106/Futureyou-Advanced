import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose }) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const [step, setStep] = useState(1); // 1 = details, 2 = avatar synchronization
    const [isCapturing, setIsCapturing] = useState(false);

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage('');

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onClose();
            } else {
                if (step === 1) {
                    // Just validate and move to step 2 for "onboarding experience"
                    setStep(2);
                } else {
                    const { data, error } = await supabase.auth.signUp({ email, password });
                    if (error) throw error;

                    if (data?.session === null) {
                        setMessage('Registration successful! Please check your email.');
                    } else {
                        setMessage('Timeline Initialized. Future Sync Complete.');
                        setTimeout(onClose, 2000);
                    }
                }
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        className="w-full max-w-md relative"
                    >
                        <div className="neon-border absolute inset-0 -z-10 rounded-3xl opacity-50"></div>
                        <div className="glass-panel p-8 rounded-3xl relative overflow-hidden">
                            {/* NEW: Onboarding Step 2 - Avatar Camera Mock */}
                            {!isLogin && step === 2 ? (
                                <motion.div 
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="relative z-10"
                                >
                                    <h2 className="text-3xl font-bold tracking-tighter mb-2 bg-gradient-to-r from-neon to-purple bg-clip-text text-transparent">
                                        Identity Sync
                                    </h2>
                                    <p className="text-gray-400 text-sm mb-6">
                                        Capture your essence to generate your 3D future self. 
                                    </p>

                                    <div className="aspect-square w-full rounded-2xl bg-black/40 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden group mb-6">
                                        {isCapturing ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
                                                <div className="w-12 h-12 rounded-full border-2 border-neon border-t-transparent animate-spin mb-4"></div>
                                                <p className="text-xs font-black uppercase tracking-widest text-neon">Scanning Neural Patterns...</p>
                                                <p className="text-[10px] text-gray-500 mt-2">"Photo-Zero" Protocol Active: Image discarded after mesh generation.</p>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="w-16 h-16 rounded-full border-2 border-white/5 flex items-center justify-center mb-4 group-hover:border-neon/30 transition-colors">
                                                    <div className="w-10 h-10 rounded-full bg-white/5"></div>
                                                </div>
                                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Connect Camera Permission</p>
                                                <div className="absolute bottom-4 left-0 right-0 px-8">
                                                    <button 
                                                        onClick={() => {
                                                            setIsCapturing(true);
                                                            setTimeout(() => {
                                                                setIsCapturing(false);
                                                                handleAuth({ preventDefault: () => {} });
                                                            }, 3000);
                                                        }}
                                                        className="w-full py-3 bg-neon text-dark font-black text-[10px] uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-transform"
                                                    >
                                                        Scan Face & Initialize
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <button 
                                        onClick={() => handleAuth({ preventDefault: () => {} })}
                                        className="w-full text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                                    >
                                        Use Default Avatar Instead
                                    </button>
                                </motion.div>
                            ) : (
                                <div className="relative z-10">
                                    <button
                                        onClick={onClose}
                                        className="absolute top-0 right-0 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <X size={20} />
                                    </button>

                                    <h2 className="text-3xl font-bold tracking-tighter mb-2 bg-gradient-to-r from-neon to-purple bg-clip-text text-transparent">
                                        {isLogin ? 'Access Timeline' : 'Initialize Profile'}
                                    </h2>
                                    <p className="text-gray-400 text-sm mb-8">
                                        {isLogin ? 'Welcome back to your quantum trajectory.' : 'Synchronizing your neural link to the future.'}
                                    </p>

                                    <form onSubmit={handleAuth} className="flex flex-col gap-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2 block">Email Coordinates</label>
                                            <input
                                                type="email"
                                                value={email}
                                                autoFocus
                                                onChange={(e) => setEmail(e.target.value)}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon transition-colors"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-gray-400 tracking-widest uppercase mb-2 block">Security Key</label>
                                            <input
                                                type="password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-neon transition-colors"
                                            />
                                        </div>

                                        {error && <div className="text-red-400 text-sm mt-2">{error}</div>}
                                        {message && <div className="text-neon text-sm mt-2">{message}</div>}

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full mt-4 py-4 bg-white text-dark font-bold tracking-widest uppercase rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,255,204,0.4)] hover:text-neon transition-all"
                                        >
                                            {loading ? 'Processing...' : (isLogin ? 'Authenticate' : 'Next: Identity Sync')}
                                        </button>
                                    </form>

                                    <div className="mt-6 text-center">
                                        <button
                                            onClick={() => {
                                                setIsLogin(!isLogin);
                                                setStep(1);
                                            }}
                                            className="text-gray-400 text-sm hover:text-white transition-colors"
                                        >
                                            {isLogin ? "Don't have a timeline yet? Initialize one." : "Already linked? Authenticate here."}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
