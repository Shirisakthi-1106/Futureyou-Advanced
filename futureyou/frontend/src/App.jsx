import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useContext } from 'react';
import { AppContext } from './context/AppContext';
import Navbar from './components/Navbar';
import ThreeCanvas from './components/ThreeCanvas';
import CustomCursor from './components/CustomCursor';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import ProtectedRoute from './components/ProtectedRoute';
import AuthModal from './components/AuthModal';
import SimulationPage from './pages/SimulationPage';
import PersonaChat from './pages/PersonaChat';
import ProfileSettings from './pages/ProfileSettings';
import GuardianPortal from './pages/GuardianPortal';

function App() {
  const location = useLocation();
  const { isAuthOpen, setIsAuthOpen } = useContext(AppContext);

  return (
    <div className="min-h-screen bg-dark text-white font-sans overflow-x-hidden relative">
      <CustomCursor />
      <ThreeCanvas />
      <Navbar />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />

      <main className="relative z-10 w-full px-6">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/simulation" element={<ProtectedRoute><SimulationPage /></ProtectedRoute>} />
            <Route path="/persona" element={<ProtectedRoute><PersonaChat /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><ProfileSettings /></ProtectedRoute>} />
            <Route path="/guardian-portal" element={<GuardianPortal />} />
          </Routes>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
