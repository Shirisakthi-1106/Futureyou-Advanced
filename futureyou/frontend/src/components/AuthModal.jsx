import { useState, useContext } from "react";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

export default function AuthModal({ isOpen, onClose }) {
    const { loginDemoUser } = useContext(AppContext);
    const navigate = useNavigate();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState("");

    const handleAuth = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage("");

        try {
            if (isLogin) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) {
                    // Rate limit or unverified email → auto-fallback to demo mode
                    if (isRateLimitOrVerificationError(error.message)) {
                        console.warn("Supabase Auth limited — switching to local auth mode.");
                        setMessage("Server rate-limited. Logging you in locally...");
                        setTimeout(() => {
                            loginAsLocalUser(email);
                            navigate("/dashboard");
                        }, 800);
                        return;
                    }
                    throw error;
                }
                onClose();
                navigate("/dashboard");
            } else {
                const { data, error } = await supabase.auth.signUp({ email, password });
                if (error) {
                    if (isRateLimitOrVerificationError(error.message)) {
                        console.warn("Supabase Auth limited — creating local profile.");
                        setMessage("Server rate-limited. Creating local profile...");
                        setTimeout(() => {
                            loginAsLocalUser(email);
                            navigate("/dashboard");
                        }, 800);
                        return;
                    }
                    throw error;
                }

                if (data?.session === null) {
                    // Email verification is pending — but we bypass it for hackathon/demo
                    setMessage("Profile created! Syncing your timeline...");
                    setTimeout(() => {
                        loginAsLocalUser(email);
                        navigate("/dashboard");
                    }, 800);
                } else {
                    setMessage("Timeline Initialized. Future Sync Complete.");
                    setTimeout(() => {
                        onClose();
                        navigate("/dashboard");
                    }, 1500);
                }
            }
        } catch (err) {
            const msg = err.message || "Unknown error";
            if (msg.includes("Invalid login credentials")) {
                setError("Invalid email or password. Please try again or create a new profile.");
            } else if (msg.includes("User already registered")) {
                setError("This email is already registered. Try logging in instead.");
            } else if (msg.includes("Password should be at least")) {
                setError("Password must be at least 6 characters.");
            } else if (msg.includes("invalid") && msg.includes("email")) {
                setError("Please enter a valid email address.");
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    // Check if a Supabase error is a rate limit or email verification issue
    const isRateLimitOrVerificationError = (msg) => {
        if (!msg) return false;
        const lower = msg.toLowerCase();
        return lower.includes("rate limit") ||
               lower.includes("rate_limit") ||
               lower.includes("email not confirmed") ||
               lower.includes("email_send_rate") ||
               lower.includes("over_email_send");
    };

    // Create a local user profile (independent of Supabase)
    // This allows the app to work even when Supabase is unavailable or rate-limited
    const loginAsLocalUser = (userEmail) => {
        const localUser = {
            id: `local-${btoa(userEmail).replace(/[=+/]/g, '').slice(0, 16)}`,
            email: userEmail,
            name: userEmail.split("@")[0],
            isLocal: true
        };
        localStorage.setItem("futureyou_demo_user", JSON.stringify(localUser));
        loginDemoUser(localUser);
    };

    const handleSkipLogin = () => {
        loginDemoUser();
        navigate("/dashboard");
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
                            <div className="relative z-10">
                                <button
                                    onClick={onClose}
                                    className="absolute top-0 right-0 text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>

                                <h2 className="text-3xl font-bold tracking-tighter mb-2 bg-gradient-to-r from-neon to-purple bg-clip-text text-transparent">
                                    {isLogin ? "Access Timeline" : "Initialize Profile"}
                                </h2>
                                <p className="text-gray-400 text-sm mb-8">
                                    {isLogin ? "Welcome back to your quantum trajectory." : "Synchronizing your neural link to the future."}
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

                                    {error && (
                                        <div className="mt-1 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                                            <div className="text-red-400 text-sm">{error}</div>
                                        </div>
                                    )}
                                    {message && (
                                        <div className="mt-1 p-3 rounded-xl bg-neon/10 border border-neon/20">
                                            <div className="text-neon text-sm">{message}</div>
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full mt-2 py-4 bg-white text-dark font-bold tracking-widest uppercase rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,255,204,0.4)] hover:text-neon transition-all disabled:opacity-50"
                                    >
                                        {loading ? "Processing..." : (isLogin ? "Authenticate" : "Create Profile")}
                                    </button>
                                </form>

                                <div className="mt-6 flex flex-col items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setIsLogin(!isLogin);
                                            setError(null);
                                            setMessage("");
                                        }}
                                        className="text-gray-400 text-sm hover:text-white transition-colors"
                                    >
                                        {isLogin ? "Don't have a timeline yet? Initialize one." : "Already linked? Authenticate here."}
                                    </button>

                                    <div className="w-full flex items-center gap-3 mt-2">
                                        <div className="flex-1 h-px bg-white/10"></div>
                                        <span className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">or</span>
                                        <div className="flex-1 h-px bg-white/10"></div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleSkipLogin}
                                        className="text-gray-500 text-xs hover:text-gray-300 transition-colors"
                                    >
                                        Continue without account →
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
