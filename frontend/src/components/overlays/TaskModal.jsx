import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Pause, CheckCircle, AlertTriangle } from 'lucide-react';
import HourglassTimer from '../hud/HourglassTimer';

const TaskModal = ({ activeTask, onClose, onVerify, playClick, loading }) => {
  const [modalMode, setModalMode] = useState('timer'); // 'timer' | 'verify'
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(activeTask.estimated_time * 60);
  const [proof, setProof] = useState("");
  const [proofImage, setProofImage] = useState(null);

  // Timer Effect
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    else if (timeLeft === 0) setIsTimerRunning(false);
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  return (
    <AnimatePresence>
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg bg-surface border border-border p-8 rounded-3xl relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
          <button onClick={() => { playClick(); onClose(); }} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>

          {modalMode === 'timer' ? (
            <div className="text-center">
              <div className="mb-8"><h2 className="text-2xl font-bold text-white mb-2">{activeTask.title}</h2><p className="text-sm text-gray-500 font-mono uppercase tracking-widest">Protocol Active</p></div>
              {/* KRYTA Hourglass Timer */}
              <div className="mb-10 flex justify-center">
                <HourglassTimer
                  timeLeft={timeLeft}
                  totalTime={activeTask.estimated_time * 60}
                  isActive={isTimerRunning}
                />
              </div>
              <div className="flex gap-4">
                <button onClick={() => { playClick(); setIsTimerRunning(!isTimerRunning); }} className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isTimerRunning ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-primary text-black hover:bg-violet-400'}`}>{isTimerRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />} {isTimerRunning ? "PAUSE" : "ENGAGE"}</button>
                <button onClick={() => { playClick(); setModalMode('verify'); }} className="px-6 border border-border rounded-xl hover:bg-white/5 text-green-500 hover:border-green-500/50 transition-all"><CheckCircle size={28} /></button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <h3 className="text-xl font-bold">Verification Required</h3>
              {activeTask.last_failure_reason && (
                <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl flex items-start gap-3 text-red-200 text-sm animate-pulse">
                  <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                  <div><span className="font-bold block text-xs uppercase tracking-widest text-red-500">Changes Requested</span>{activeTask.last_failure_reason}</div>
                </div>
              )}
              <textarea className="w-full bg-black/50 border border-border rounded-xl p-4 h-32 focus:border-primary outline-none resize-none" placeholder="Describe your execution..." value={proof} onChange={(e) => setProof(e.target.value)} />
              <div className="relative group">
                <input type="file" accept="image/*" id="proof-upload" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { const base64 = reader.result.split(',')[1]; setProofImage(base64); playClick(); }; reader.readAsDataURL(file); } }} />
                <label htmlFor="proof-upload" className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${proofImage ? 'border-primary bg-primary/10' : 'border-border hover:border-gray-500 hover:bg-white/5'}`}>{proofImage ? (<div className="flex items-center gap-2 text-primary font-bold"><CheckCircle size={20} /> Image Attached</div>) : (<span className="text-gray-500 text-xs uppercase tracking-widest group-hover:text-gray-300">Upload Visual Evidence</span>)}</label>
              </div>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { playClick(); setModalMode('timer'); }} className="flex-1 py-3 rounded-xl bg-gray-800">Back</button>
                <button onClick={() => onVerify(activeTask.id, proof, proofImage)} disabled={loading} className="flex-1 py-3 rounded-xl bg-white text-black font-bold">{loading ? "Analyzing..." : "Confirm"}</button>
              </div>
              <div className="text-center mt-1"><p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Secure Uplink • Data Encrypted</p></div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default TaskModal;