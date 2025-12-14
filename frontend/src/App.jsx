import { useState, useEffect } from 'react';
import { api } from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Flame, Target, CheckCircle, Loader2, 
  Play, Pause, Square, Timer as TimerIcon, X 
} from 'lucide-react';

// --- Helper: Format Seconds to MM:SS ---
const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

function App() {
  // Global State
  const [user, setUser] = useState({ xp: 0, streak: 0, name: "User" });
  const [tasks, setTasks] = useState([]);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [appReady, setAppReady] = useState(false);

  // Modal / Active Task State
  const [activeTask, setActiveTask] = useState(null); // The task being worked on
  const [modalMode, setModalMode] = useState('timer'); // 'timer' | 'verify'
  const [proof, setProof] = useState("");
  
  // Timer State
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // 1. Load Data
  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getDashboard();
        if (data.user) setUser(data.user);
        if (data.tasks) setTasks(data.tasks);
      } catch (e) {
        console.error("Connection failed:", e);
      }
      setAppReady(true);
    }
    loadData();
  }, []);

  // 2. Timer Ticking Logic
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // Actions
  const openTask = (task) => {
    setActiveTask(task);
    setModalMode('timer');
    setTimeLeft(task.estimated_time * 60); // Convert mins to seconds
    setIsTimerRunning(false); // Wait for user to start
  };

  const handlePlan = async () => {
    if (!goal) return;
    setLoading(true);
    try {
      const res = await api.planDay(goal, 60); 
      if (res.tasks) setTasks(res.tasks);
    } catch (e) { alert("Backend Error"); }
    setLoading(false);
  };

  const handleVerify = async () => {
    if (!activeTask || !proof) return;
    setLoading(true);
    try {
      const res = await api.verifyTask(activeTask.id, proof);
      
      setTasks(prev => prev.map(t => 
        t.id === activeTask.id ? { ...t, status: res.task_status } : t
      ));
      
      if(res.reward) {
        setUser(prev => ({
            ...prev,
            xp: res.reward.total_user_xp,
            streak: res.reward.current_streak
        }));
        // Optional: Play a sound here
      }
      
      closeModal();
    } catch (e) { alert("Verification failed"); }
    setLoading(false);
  };

  const closeModal = () => {
    setActiveTask(null);
    setProof("");
    setIsTimerRunning(false);
  };

  if (!appReady) {
    return (
      <div className="h-screen bg-background flex items-center justify-center text-gray-500">
        <Loader2 className="animate-spin mr-2" /> Synapses firing...
      </div>
    );
  }

  // Calculate Progress for Circle
  const totalSeconds = activeTask ? activeTask.estimated_time * 60 : 1;
  const progress = ((totalSeconds - timeLeft) / totalSeconds) * 100;
  const level = Math.floor(user.xp / 100) + 1;

  return (
    <div className="flex h-screen text-white font-sans overflow-hidden bg-background">
      {/* Sidebar */}
      <div className="w-64 bg-surface border-r border-gray-800 p-6 flex flex-col z-10">
        <div className="flex items-center gap-2 mb-8 text-primary">
            <Target size={24} />
            <h1 className="text-xl font-bold">Focus AI</h1>
        </div>

        <div className="bg-black/30 rounded-xl p-4 mb-6 border border-gray-800">
            <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400 text-sm">Level {level}</span>
                <span className="text-primary font-mono text-sm">{user.xp} XP</span>
            </div>
            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-primary transition-all duration-500" 
                    style={{ width: `${user.xp % 100}%` }}
                />
            </div>
        </div>

        <div className="space-y-4">
            <div className="flex items-center gap-3 text-gray-300">
                <Flame className="text-orange-500" size={20} />
                <div>
                    <span className="text-xs text-gray-500 block">Streak</span>
                    <span className="font-bold">{user.streak} Days</span>
                </div>
            </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col p-8 overflow-y-auto relative">
        {tasks.length === 0 ? (
          <div className="max-w-xl mx-auto w-full mt-20">
            <h2 className="text-3xl font-bold mb-4 text-center">Protocol Not Found</h2>
            <textarea 
              className="w-full bg-surface border border-gray-700 rounded-lg p-4 text-lg focus:outline-none focus:border-primary transition-colors resize-none"
              rows={3}
              placeholder="What is the objective?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
            />
            <button 
              onClick={handlePlan}
              disabled={loading}
              className="mt-4 w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Initiate Planning"}
            </button>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto w-full pb-20">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h2 className="text-3xl font-bold">Today's Protocol</h2>
                    <p className="text-gray-400 text-sm mt-1">{tasks.filter(t => t.status === 'completed').length} / {tasks.length} Completed</p>
                </div>
            </div>
            
            <div className="space-y-4">
              {tasks.map((task, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={task.id}
                  onClick={() => task.status !== 'completed' && openTask(task)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all group relative overflow-hidden ${
                    task.status === 'completed' 
                      ? 'bg-green-900/10 border-green-900/50 opacity-60' 
                      : 'bg-surface border-gray-800 hover:border-primary/50'
                  }`}
                >
                  <div className="flex justify-between items-start relative z-10">
                    <div className="flex gap-4">
                        <div className={`mt-1 ${task.status === 'completed' ? 'text-green-500' : 'text-gray-600 group-hover:text-primary'}`}>
                            {task.status === 'completed' ? <CheckCircle size={24} /> : <div className="w-6 h-6 rounded-full border-2 border-current" />}
                        </div>
                        <div>
                            <h3 className={`font-semibold text-lg ${task.status === 'completed' && 'line-through text-gray-500'}`}>{task.title}</h3>
                            <p className="text-sm text-gray-400 mt-1">{task.success_criteria}</p>
                        </div>
                    </div>
                    <span className="text-xs font-mono bg-black/40 px-2 py-1 rounded text-gray-400 flex items-center gap-1">
                      <TimerIcon size={12} />
                      {task.estimated_time}m
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SUPER MODAL */}
      <AnimatePresence>
        {activeTask && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-gray-700 p-8 rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden"
            >
                {/* Close Button */}
                <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                    <X size={24} />
                </button>

                {modalMode === 'timer' ? (
                    // --- MODE 1: TIMER ---
                    <div className="flex flex-col items-center text-center">
                        <h3 className="text-xl font-medium text-gray-300 mb-2">{activeTask.title}</h3>
                        <p className="text-sm text-gray-500 mb-8">{activeTask.minimum_viable_done}</p>

                        {/* Timer Circle */}
                        <div className="relative w-64 h-64 mb-8 flex items-center justify-center">
                            <svg className="absolute w-full h-full -rotate-90">
                                <circle cx="128" cy="128" r="120" stroke="#333" strokeWidth="8" fill="none" />
                                <circle 
                                    cx="128" cy="128" r="120" 
                                    stroke="#3b82f6" strokeWidth="8" fill="none" 
                                    strokeDasharray="753" 
                                    strokeDashoffset={753 - (753 * progress) / 100}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-linear"
                                />
                            </svg>
                            <div className="text-6xl font-mono font-bold tracking-tighter">
                                {formatTime(timeLeft)}
                            </div>
                        </div>

                        {/* Controls */}
                        <div className="flex gap-4 w-full">
                            {!isTimerRunning ? (
                                <button 
                                    onClick={() => setIsTimerRunning(true)}
                                    className="flex-1 bg-primary text-black py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-400 transition-colors"
                                >
                                    <Play fill="black" size={20} /> Start Focus
                                </button>
                            ) : (
                                <button 
                                    onClick={() => setIsTimerRunning(false)}
                                    className="flex-1 bg-gray-800 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-700 transition-colors"
                                >
                                    <Pause fill="white" size={20} /> Pause
                                </button>
                            )}
                            
                            <button 
                                onClick={() => setModalMode('verify')}
                                className="px-6 border border-gray-600 rounded-xl hover:bg-gray-800 transition-colors text-green-400"
                            >
                                <CheckCircle size={28} />
                            </button>
                        </div>
                    </div>
                ) : (
                    // --- MODE 2: VERIFY ---
                    <div>
                         <h3 className="text-2xl font-bold mb-2">Mission Complete?</h3>
                         <p className="text-gray-400 mb-6 text-sm">Upload proof or describe your success.</p>
                        
                         <textarea 
                            className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 mb-6 h-32 focus:border-green-500 outline-none text-lg"
                            placeholder="I completed the task by..."
                            value={proof}
                            onChange={(e) => setProof(e.target.value)}
                            autoFocus
                         />
                        
                         <div className="flex gap-3">
                            <button 
                                onClick={() => setModalMode('timer')}
                                className="flex-1 py-3 rounded-xl bg-gray-800 hover:bg-gray-700"
                            >
                                Back to Timer
                            </button>
                            <button 
                                onClick={handleVerify}
                                disabled={loading}
                                className="flex-1 py-3 rounded-xl bg-white text-black font-bold hover:bg-gray-200 flex justify-center items-center gap-2"
                            >
                                {loading && <Loader2 className="animate-spin" size={18} />}
                                {loading ? "Verifying..." : "Submit Proof"}
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