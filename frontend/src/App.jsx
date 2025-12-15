import { useState, useEffect } from 'react';
import { api } from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Flame, Target, CheckCircle, Loader2, 
  Play, Pause, X, Terminal, Clock, LayoutGrid, BarChart3, Settings
} from 'lucide-react';

// --- Utility: Time Formatter for the Clock ---
const useTime = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
};

// --- COMPONENT: The Premium Clock ---
const DaemonClock = () => {
  const time = useTime();
  return (
    <div className="text-right">
      <div className="text-4xl font-mono font-bold tracking-tighter text-white">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-xs text-gray-500 font-mono tracking-widest uppercase mt-1">
        {time.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' })}
      </div>
    </div>
  );
};

// --- COMPONENT: Status Corner (Top Left) ---
const StatusCorner = ({ user }) => {
  const level = Math.floor(user.xp / 100) + 1;
  const progress = user.xp % 100;

  return (
    <div className="flex gap-4 items-center">
        {/* Hexagon Placeholder or Avatar */}
        <div className="w-12 h-12 bg-primary/20 rounded-lg border border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
            <Terminal size={20} className="text-primary" />
        </div>
        
        <div>
            <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold text-gray-400 tracking-wider">OPERATOR Lvl.{level}</span>
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded border border-primary/20">{user.streak} DAY STREAK</span>
            </div>
            {/* XP Bar */}
            <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary shadow-[0_0_10px_#7c3aed]" style={{ width: `${progress}%` }} />
            </div>
        </div>
    </div>
  );
};

function App() {
  const [view, setView] = useState('home'); // 'home', 'analytics', 'settings'
  const [user, setUser] = useState({ xp: 0, streak: 0 });
  const [tasks, setTasks] = useState([]);
  
  // Inputs
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  const [proofImage, setProofImage] = useState(null);
  
  // Modal / Active Task
  const [activeTask, setActiveTask] = useState(null);
  const [modalMode, setModalMode] = useState('timer'); 
  const [proof, setProof] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // --- INITIAL DATA LOAD ---
  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getDashboard();
        if (data.user) setUser(data.user);
        if (data.tasks) setTasks(data.tasks);
      } catch (e) { console.error(e); }
    }
    loadData();
  }, []);

  // --- TIMER LOGIC ---
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) setIsTimerRunning(false);
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // --- ACTIONS ---
  const handlePlan = async (e) => {
    if (e.key !== 'Enter' || !goal) return;
    setLoading(true);
    try {
      const res = await api.planDay(goal, 60);
      if (res.tasks) {
        // Merge new tasks with old ones instead of replacing
        setTasks(prev => [...prev, ...res.tasks]); 
        setGoal(""); // Clear input
      }
    } catch (e) { alert("Daemon is unreachable."); }
    setLoading(false);
  };

  const openTask = (task) => {
    setActiveTask(task);
    setModalMode('timer');
    setProofImage(null); // Reset here
    setTimeLeft(task.estimated_time * 60);
    setIsTimerRunning(false);
  };

  const handleVerify = async () => {
    if (!activeTask || (!proof && !proofImage)) return; // Allow image OR text
    setLoading(true);
    try {
      // Pass proofImage to the API
      const res = await api.verifyTask(activeTask.id, proof, proofImage);
      
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, status: res.task_status } : t));
      if(res.reward) {
        setUser(prev => ({ ...prev, xp: res.reward.total_user_xp, streak: res.reward.current_streak }));
      }
      setActiveTask(null);
      setProof("");
      setProofImage(null); // Reset image
    } catch (e) { alert("Verification failed"); }
    setLoading(false);
  };

  return (
    <div className="h-screen w-screen bg-background text-gray-200 font-sans overflow-hidden relative selection:bg-primary/30">
      
      {/* --- LAYER 1: BACKGROUND GRID --- */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* --- LAYER 2: TOP HUD --- */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-20">
        <StatusCorner user={user} />
        <DaemonClock />
      </div>

      {/* --- LAYER 3: BOTTOM HUD (Nav & Input) --- */}
      <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end z-20 pointer-events-none">
        
        {/* Placeholder for future Left-Bottom corner (maybe notifications?) */}
        <div className="w-20"></div>

        {/* CENTER: The Command Bar (Sticky Planner) */}
        <div className="flex-1 max-w-2xl mx-4 pointer-events-auto">
             <div className="bg-surface/80 backdrop-blur-md border border-border rounded-2xl p-1 flex items-center shadow-2xl ring-1 ring-white/5">
                <div className="px-4 text-primary animate-pulse">
                    <Terminal size={18} />
                </div>
                <input 
                    type="text"
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 h-12 font-medium"
                    placeholder={loading ? "DAEMON is thinking..." : "Enter directive..."}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    onKeyDown={handlePlan}
                    disabled={loading}
                />
                {loading && <Loader2 className="animate-spin text-gray-500 mr-4" size={18}/>}
             </div>
             <div className="text-center mt-2">
                <span className="text-[10px] text-gray-600 uppercase tracking-widest">Daemon v1.0 • Ready for Input</span>
             </div>
        </div>

        {/* RIGHT: Navigation Docker */}
        <div className="flex gap-2 pointer-events-auto bg-surface/50 backdrop-blur-md p-2 rounded-2xl border border-border">
            <button 
                onClick={() => setView('home')}
                className={`p-3 rounded-xl transition-all ${view === 'home' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
            >
                <LayoutGrid size={20} />
            </button>
            <button 
                onClick={() => setView('analytics')}
                className={`p-3 rounded-xl transition-all ${view === 'analytics' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
            >
                <BarChart3 size={20} />
            </button>
            <button 
                 onClick={() => setView('settings')}
                 className={`p-3 rounded-xl transition-all ${view === 'settings' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
            >
                <Settings size={20} />
            </button>
        </div>
      </div>

      {/* --- LAYER 4: MAIN CONTENT AREA --- */}
      <div className="absolute inset-0 pt-32 pb-32 px-8 overflow-y-auto scrollbar-hide z-10 flex flex-col items-center">
        
        {/* WELCOME MESSAGE */}
        {tasks.length === 0 && !loading && (
             <motion.div 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-center mt-20"
             >
                <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Good Morning, Operator.</h1>
                <p className="text-gray-500 text-lg max-w-md mx-auto">
                    The system is online. Input your primary objective below to initiate the protocol.
                </p>
             </motion.div>
        )}

        {/* TASKS GRID */}
        <div className="w-full max-w-3xl space-y-3">
            {tasks.map((task, i) => (
                <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => task.status !== 'completed' && openTask(task)}
                    className={`group relative p-4 rounded-xl border backdrop-blur-sm transition-all cursor-pointer overflow-hidden ${
                        task.status === 'completed' 
                            ? 'bg-green-900/10 border-green-900/30 opacity-50' 
                            : 'bg-glass border-border hover:border-primary/50 hover:bg-white/5'
                    }`}
                >
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-600 group-hover:border-primary'
                            }`}>
                                {task.status === 'completed' && <CheckCircle size={14} className="text-black" />}
                            </div>
                            <div>
                                <h3 className={`font-medium ${task.status === 'completed' && 'line-through text-gray-500'}`}>{task.title}</h3>
                                {task.status !== 'completed' && <p className="text-xs text-gray-500">{task.success_criteria}</p>}
                            </div>
                        </div>
                        <div className="text-xs font-mono text-gray-500 bg-black/50 px-2 py-1 rounded">
                            {task.estimated_time} MIN
                        </div>
                    </div>
                    {/* Hover Glow Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                </motion.div>
            ))}
        </div>
      </div>

      {/* --- LAYER 5: FOCUS MODAL (The same logic, restyled) --- */}
      <AnimatePresence>
        {activeTask && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg bg-surface border border-border p-8 rounded-3xl relative shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
                <button onClick={() => setActiveTask(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>

                {modalMode === 'timer' ? (
                    <div className="text-center">
                        <div className="mb-8">
                             <h2 className="text-2xl font-bold text-white mb-2">{activeTask.title}</h2>
                             <p className="text-sm text-gray-500 font-mono uppercase tracking-widest">Protocol Active</p>
                        </div>

                        {/* TIMER DISPLAY */}
                        <div className="text-8xl font-mono font-bold text-white mb-10 tracking-tighter tabular-nums">
                            {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{Math.floor(timeLeft % 60).toString().padStart(2, '0')}
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setIsTimerRunning(!isTimerRunning)}
                                className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                                    isTimerRunning ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-primary text-black hover:bg-violet-400'
                                }`}
                            >
                                {isTimerRunning ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>}
                                {isTimerRunning ? "PAUSE" : "ENGAGE"}
                            </button>
                            <button 
                                onClick={() => setModalMode('verify')}
                                className="px-6 border border-border rounded-xl hover:bg-white/5 text-green-500 hover:border-green-500/50 transition-all"
                            >
                                <CheckCircle size={28} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <h3 className="text-xl font-bold">Verification Required</h3>
                        <textarea 
                            className="w-full bg-black/50 border border-border rounded-xl p-4 h-32 focus:border-primary outline-none resize-none"
                            placeholder="Describe your execution..."
                            value={proof}
                            onChange={(e) => setProof(e.target.value)}
                            autoFocus
                        />
                        {/* --- IMAGE UPLOAD AREA --- */}
<div className="relative group">
    <input 
        type="file" 
        accept="image/*"
        id="proof-upload"
        className="hidden" 
        onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    // Extract base64 part only
                    const base64 = reader.result.split(',')[1];
                    setProofImage(base64); // Need to add this state variable
                };
                reader.readAsDataURL(file);
            }
        }}
    />
    
    <label 
        htmlFor="proof-upload" 
        className={`h-32 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${
            proofImage 
            ? 'border-primary bg-primary/10' 
            : 'border-border hover:border-gray-500 hover:bg-white/5'
        }`}
    >
        {proofImage ? (
            <div className="relative w-full h-full">
                <img 
                    src={`data:image/jpeg;base64,${proofImage}`} 
                    className="w-full h-full object-cover opacity-80" 
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="text-white font-bold bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">Image Loaded</span>
                </div>
            </div>
        ) : (
            <>
                <div className="bg-gray-800 p-3 rounded-full mb-2 group-hover:bg-gray-700 transition-colors">
                    <LayoutGrid size={20} className="text-gray-400" /> 
                </div>
                <span className="text-gray-500 text-xs uppercase tracking-widest group-hover:text-gray-300">Upload Visual Evidence</span>
            </>
        )}
    </label>
</div>

                        <div className="flex gap-3 mt-4">
                             <button onClick={() => setModalMode('timer')} className="flex-1 py-3 rounded-xl bg-gray-800">Back</button>
                             <button onClick={handleVerify} disabled={loading} className="flex-1 py-3 rounded-xl bg-white text-black font-bold">
                                {loading ? "Analyzing..." : "Confirm"}
                             </button>
                        </div>
                    </div>
                )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;