import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AppContext } from '../context/AppContext';

export default function ProtectedRoute({ children }) {
    const { user, authLoading } = useContext(AppContext);

    if (authLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center pt-20">
                <div className="text-neon animate-pulse text-xl tracking-widest uppercase">Authorizing Quantum Link...</div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/" />;
    }

    return children;
}
