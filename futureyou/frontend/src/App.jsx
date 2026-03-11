import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useContext } from 'react';
import { AppContext } from './context/AppContext';
import Navbar from './components/Navbar';
import ThreeCanvas from './components/ThreeCanvas';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import ProtectedRoute from './components/ProtectedRoute';
import AuthModal from './components/AuthModal';

function App() {
  const location = useLocation();
  const { isAuthOpen, setIsAuthOpen } = useContext(AppContext);

  return (
    <div className="min-h-screen bg-dark text-white font-sans overflow-x-hidden relative">
      <ThreeCanvas />
      <Navbar />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <main className="relative z-10 w-full px-6">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
