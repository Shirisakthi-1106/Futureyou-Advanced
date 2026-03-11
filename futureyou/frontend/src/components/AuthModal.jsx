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
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;

                if (data?.session === null) {
                    setMessage('Registration successful! Please check your email to verify your account.');
                    // Don't auto-close the modal, let them read the message
                } else {
                    setMessage('Registration successful! You are now logged in.');
                    setTimeout(onClose, 2000);
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
                        <div className="glass-panel p-8 rounded-3xl relative">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={24} />
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
                                    {loading ? 'Processing...' : (isLogin ? 'Authenticate' : 'Create Link')}
                                </button>
                            </form>

                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => setIsLogin(!isLogin)}
                                    className="text-gray-400 text-sm hover:text-white transition-colors"
                                >
                                    {isLogin ? "Don't have a timeline yet? Initialize one." : "Already linked? Authenticate here."}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
