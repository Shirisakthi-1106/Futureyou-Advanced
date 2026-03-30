import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useContext } from 'react';
import { AppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import { LogOut, User } from 'lucide-react';

export default function Navbar() {
    const location = useLocation();
    const { user, setIsAuthOpen } = useContext(AppContext);

    const navItems = [
        { path: '/', label: 'The Form' },
        { path: '/dashboard', label: 'Trajectory Dashboard' },
        { path: '/simulation', label: 'Simulation' },
        { path: '/persona', label: 'Persona Chat' },
        { path: '/profile', label: 'Identity Hub' },
        { path: '/chat', label: 'Future Chat' }
    ];

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <nav className="fixed top-0 w-full z-50 bg-dark/50 backdrop-blur-md border-b border-white/5">
            <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                <Link to="/" className="text-xl font-bold tracking-tighter w-40">
                    <span className="text-white">Future</span>
                    <span className="text-neon">You</span>
                </Link>

                <div className="flex gap-2 bg-white/5 p-1 rounded-full border border-white/10 hidden md:flex">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`relative px-6 py-2 rounded-full text-sm font-medium transition-colors ${isActive ? 'text-white' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="nav-pill"
                                        className="absolute inset-0 bg-white/10 rounded-full border border-white/20"
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">{item.label}</span>
                            </Link>
                        )
                    })}
                </div>

                <div className="w-40 flex justify-end">
                    {user ? (
                        <div className="flex items-center gap-4">
                            <div className="text-sm text-gray-400 hidden sm:block truncate max-w-[120px]" title={user.email}>
                                {user.email}
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-red-400 transition-colors bg-white/5 hover:bg-white/10 rounded-full border border-white/5"
                                title="Sign Out"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsAuthOpen(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-full border border-white/10 transition-colors text-sm font-medium"
                        >
                            <User size={16} /> <span className="hidden sm:inline">Connect</span>
                        </button>
                    )}
                </div>
            </div>
        </nav>
    )
}
