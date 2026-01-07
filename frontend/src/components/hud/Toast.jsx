import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, AlertTriangle, Terminal } from 'lucide-react';

const Toast = ({ toast }) => {
  return (
    <AnimatePresence>
      {toast && (
        <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -20, scale: 0.9 }} 
            className={`absolute top-24 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl border backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-3 whitespace-nowrap max-w-[90vw] overflow-hidden text-ellipsis ${
                toast.type === 'success' ? 'bg-green-900/20 border-green-500/50 text-green-400' : 
                toast.type === 'error' ? 'bg-red-900/20 border-red-500/50 text-red-400' : 
                'bg-primary/20 border-primary/50 text-primary-300'
            }`}
        >
          {toast.type === 'success' ? <Trophy size={18} /> : toast.type === 'error' ? <AlertTriangle size={18} /> : <Terminal size={18} />}
          <span className="font-mono text-sm font-bold tracking-wide uppercase truncate">{toast.message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
export default Toast;