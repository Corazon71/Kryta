import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const SystemLockdown = ({ isLocked, lockMessage, onUnlock }) => {
  return (
    <AnimatePresence>
        {isLocked && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[200] bg-red-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8">
                <div className="mb-6 animate-pulse"><AlertTriangle size={80} className="text-red-500" /></div>
                <h1 className="text-5xl font-black text-red-500 tracking-tighter mb-4 glitch-text">SYSTEM OVERHEAT</h1>
                <p className="text-red-200 font-mono text-xl max-w-lg border-t border-b border-red-500/30 py-4">{lockMessage || "TOO MANY FAILED ATTEMPTS. COOLING DOWN NEURAL LINK."}</p>
                <p className="mt-8 text-red-400/50 text-sm font-mono uppercase tracking-widest">PLEASE STEP AWAY FROM THE TERMINAL</p>
                <button onClick={onUnlock} className="mt-12 text-xs text-red-900 hover:text-red-500 transition-colors">[ ACKNOWLEDGE ]</button>
            </motion.div>
        )}
    </AnimatePresence>
  );
};
export default SystemLockdown;