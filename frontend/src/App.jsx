import { useState, useEffect } from 'react';
import { api } from './api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Flame, Target, CheckCircle, Loader2,
  Play, Pause, X, Terminal, Clock, LayoutGrid, BarChart3, Settings
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- UTILITY: Time Formatter ---
const useTime = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time;
};

// --- COMPONENT: Premium Clock ---
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

// --- COMPONENT: Status Corner ---
const StatusCorner = ({ user }) => {
  const level = Math.floor(user.xp / 100) + 1;
  const progress = user.xp % 100;

  return (
    <div className="flex gap-4 items-center">
      <div className="w-12 h-12 bg-primary/20 rounded-lg border border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
        <Terminal size={20} className="text-primary" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-gray-400 tracking-wider">OPERATOR Lvl.{level}</span>
          <span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded border border-primary/20">{user.streak} DAY STREAK</span>
        </div>
        <div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden">
          <div className="h-full bg-primary shadow-[0_0_10px_#7c3aed]" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: Analytics View ---
const AnalyticsView = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.getAnalytics().then(setData).catch(console.error);
  }, []);

  if (!data) return <div className="text-gray-500 mt-20 flex items-center gap-2"><Loader2 className="animate-spin" /> Accessing Data Logs...</div>;

  return (
    <div className="w-full max-w-4xl mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface/50 border border-border p-5 rounded-2xl backdrop-blur-md">
          <div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Success Rate</div>
          <div className="text-3xl font-bold text-white">{data.stats.completion_rate}%</div>
        </div>
        <div className="bg-surface/50 border border-border p-5 rounded-2xl backdrop-blur-md">
          <div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Missions Done</div>
          <div className="text-3xl font-bold text-accent">{data.stats.total_completed}</div>
        </div>
        <div className="bg-surface/50 border border-border p-5 rounded-2xl backdrop-blur-md">
          <div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Failed</div>
          <div className="text-3xl font-bold text-red-500">{data.stats.total_failed}</div>
        </div>
      </div>

      {/* Heatmap */}
      <div className="bg-surface/50 border border-border p-6 rounded-3xl backdrop-blur-md mb-6 flex flex-col items-center">
        <div className="w-full flex justify-between items-end mb-6 px-4">
          <h3 className="text-gray-400 text-sm font-mono uppercase tracking-widest">Consistency (28 Days)</h3>
          <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono">
            <span>LESS</span>
            <div className="w-2 h-2 bg-white/5 rounded-full"></div>
            <div className="w-2 h-2 bg-primary/40 rounded-full"></div>
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_5px_white]"></div>
            <span>MORE</span>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-3">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
            <div key={i} className="text-center text-[10px] text-gray-600 font-mono h-4">{d}</div>
          ))}
          {data.heatmap_data && data.heatmap_data.map((day, i) => (
            <div key={i} className="group relative">
              <div className={`w-3 h-3 rounded-full transition-all duration-500 ${day.intensity === 0 ? 'bg-white/5' :
                day.intensity === 1 ? 'bg-primary/30' :
                  day.intensity === 2 ? 'bg-primary/60 shadow-[0_0_5px_#7c3aed]' :
                    day.intensity === 3 ? 'bg-primary shadow-[0_0_8px_#7c3aed]' :
                      'bg-white shadow-[0_0_10px_white]'
                }`}></div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black border border-gray-700 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-mono">
                {day.date}: {day.count} Tasks
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-surface/50 border border-border p-6 rounded-3xl backdrop-blur-md h-72 relative">
        <h3 className="text-gray-400 text-sm mb-6 font-mono uppercase tracking-widest">Output Velocity</h3>
        <ResponsiveContainer width="100%" height="85%">
          <AreaChart data={data.chart_data}>
            <defs>
              <linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis dataKey="day" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} />
            <Area type="monotone" dataKey="minutes" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorFocus)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- COMPONENT: Settings View ---
const SettingsView = ({ showToast }) => {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState({ configured: false, masked: "Not Configured" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getKeyStatus().then(setStatus).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!key) return;
    setSaving(true);
    try {
      const res = await api.saveKey(key);
      if (res.status === 'success') {
        showToast(res.message, "success");
        setStatus({ configured: true, masked: `${key.slice(0, 4)}...${key.slice(-4)}` });
        setKey(""); // Clear input for security
      } else {
        showToast(res.message, "error");
      }
    } catch (e) {
      showToast("Connection Error", "error");
    }
    setSaving(false);
  };

  return (
    <div className="w-full max-w-2xl mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Settings className="text-primary" /> System Configuration
      </h2>

      <div className="bg-surface/50 border border-border p-8 rounded-3xl backdrop-blur-md">

        {/* Status Indicator */}
        <div className="flex items-center justify-between mb-8 p-4 bg-black/40 rounded-xl border border-white/5">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Neural Link Status</div>
            <div className={`font-mono font-bold ${status.configured ? 'text-green-500' : 'text-red-500'}`}>
              {status.configured ? "ONLINE" : "OFFLINE"}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Current Key</div>
            <div className="font-mono text-gray-400 text-sm">
              {status.masked || "N/A"}
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="space-y-4">
          <label className="block text-sm text-gray-400 font-mono">GROQ API KEY</label>
          <div className="relative">
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="gsk_..."
              className="w-full bg-black/50 border border-border rounded-xl p-4 pl-12 focus:border-primary outline-none text-white font-mono transition-all focus:ring-1 focus:ring-primary/50"
            />
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
              <Terminal size={18} />
            </div>
          </div>

          <p className="text-xs text-gray-600">
            Your key is stored locally in the encrypted database. DAEMON does not transmit it externally except to Groq.
          </p>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-white text-black font-bold py-4 rounded-xl mt-4 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
            {saving ? "Establishing Link..." : "Save Configuration"}
          </button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center text-gray-600 text-xs font-mono">
        DAEMON v2.0 // SYSTEM INTEGRITY CHECK: PASS
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState({ xp: 0, streak: 0 });
  const [tasks, setTasks] = useState([]);

  // Inputs
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);

  // Modal State
  const [activeTask, setActiveTask] = useState(null);
  const [modalMode, setModalMode] = useState('timer');
  const [proof, setProof] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // --- TOAST STATE (Moved Inside) ---
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) setIsTimerRunning(false);
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handlePlan = async (e) => {
    if (e.key !== 'Enter' || !goal) return;
    setLoading(true);
    try {
      const res = await api.planDay(goal, 60);
      if (res.tasks) {
        setTasks(prev => [...prev, ...res.tasks]);
        setGoal("");
        showToast(`Protocol Initiated: ${res.tasks.length} New Directives`, "info");
      }
    } catch (e) {
      showToast("Daemon Connection Failed", "error");
    }
    setLoading(false);
  };

  const openTask = (task) => {
    setActiveTask(task);
    setModalMode('timer');
    setProofImage(null);
    setTimeLeft(task.estimated_time * 60);
    setIsTimerRunning(false);
  };

  const handleVerify = async () => {
    if (!activeTask || (!proof && !proofImage)) return;
    setLoading(true);
    try {
      const res = await api.verifyTask(activeTask.id, proof, proofImage);

      // Update the task status in the UI immediately
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, status: res.task_status } : t));

      // --- STRICT CHECK: Only reward if status is explicitly 'completed' ---
      if (res.task_status === 'completed' && res.reward) {
        setUser(prev => ({ ...prev, xp: res.reward.total_user_xp, streak: res.reward.current_streak }));
        showToast(`Mission Accomplished: +${res.reward.xp_gained} XP`, "success");
        setActiveTask(null); // Close modal only on success
      }
      else if (res.task_status === 'partial') {
        showToast(`Partial Credit: ${res.verification?.reason || 'Criteria partially met'}`, "error");
        // We do NOT close the modal, allowing user to try again if they want
      }
      else {
        // Status is 'retry'
        showToast(`Verification Rejected: ${res.verification?.reason || 'Criteria not met'}`, "error");
        // Do NOT close modal, force them to fix it
      }

      setProof("");
      setProofImage(null);
    } catch (e) {
      showToast("Verification System Failure", "error");
    }
    setLoading(false);
  };

  return (
    <div className="h-screen w-screen bg-background text-gray-200 font-sans overflow-hidden relative selection:bg-primary/30">

      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* Top HUD */}
      <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-20">
        <StatusCorner user={user} />
        <DaemonClock />
      </div>

      {/* Bottom HUD */}
      <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end z-20 pointer-events-none">
        <div className="w-20"></div>
        <div className="flex-1 max-w-2xl mx-4 pointer-events-auto">
          <div className="bg-surface/80 backdrop-blur-md border border-border rounded-2xl p-1 flex items-center shadow-2xl ring-1 ring-white/5">
            <div className="px-4 text-primary animate-pulse"><Terminal size={18} /></div>
            <input
              type="text"
              className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 h-12 font-medium"
              placeholder={loading ? "DAEMON is thinking..." : "Enter directive..."}
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={handlePlan}
              disabled={loading}
            />
            {loading && <Loader2 className="animate-spin text-gray-500 mr-4" size={18} />}
          </div>
          <div className="text-center mt-2">
            <span className="text-[10px] text-gray-600 uppercase tracking-widest">Daemon v1.0 • Ready for Input</span>
          </div>
        </div>
        <div className="flex gap-2 pointer-events-auto bg-surface/50 backdrop-blur-md p-2 rounded-2xl border border-border">
          <button onClick={() => setView('home')} className={`p-3 rounded-xl transition-all ${view === 'home' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}><LayoutGrid size={20} /></button>
          <button onClick={() => setView('analytics')} className={`p-3 rounded-xl transition-all ${view === 'analytics' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}><BarChart3 size={20} /></button>
          <button onClick={() => setView('settings')} className={`p-3 rounded-xl transition-all ${view === 'settings' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}><Settings size={20} /></button>
        </div>
      </div>

      {/* Main Content */}
      <div className="absolute inset-0 pt-32 pb-32 px-8 overflow-y-auto scrollbar-hide z-10 flex flex-col items-center">
        {view === 'analytics' ? (
          <AnalyticsView />
        ) : view === 'settings' ? (
          // --- RENDER SETTINGS HERE ---
          <SettingsView showToast={showToast} />
        ) : (
          // --- HOME VIEW (Default) ---
          <>
            {tasks.length === 0 && !loading && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-20">
                <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">Good Morning, Operator.</h1>
                <p className="text-gray-500 text-lg max-w-md mx-auto">The system is online. Input your primary objective below to initiate the protocol.</p>
              </motion.div>
            )}
            <div className="w-full max-w-3xl space-y-3">
              {tasks.map((task, i) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => task.status !== 'completed' && openTask(task)}
                  className={`group relative p-4 rounded-xl border backdrop-blur-sm transition-all cursor-pointer overflow-hidden ${task.status === 'completed' ? 'bg-green-900/10 border-green-900/30 opacity-50' : 'bg-glass border-border hover:border-primary/50 hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${task.status === 'completed' ? 'bg-green-500 border-green-500' : 'border-gray-600 group-hover:border-primary'}`}>
                        {task.status === 'completed' && <CheckCircle size={14} className="text-black" />}
                      </div>
                      <div>
                        <h3 className={`font-medium ${task.status === 'completed' && 'line-through text-gray-500'}`}>{task.title}</h3>
                        {task.status !== 'completed' && <p className="text-xs text-gray-500">{task.success_criteria}</p>}
                      </div>
                    </div>
                    <div className="text-xs font-mono text-gray-500 bg-black/50 px-2 py-1 rounded">{task.estimated_time} MIN</div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/5 to-primary/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {activeTask && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg bg-surface border border-border p-8 rounded-3xl relative shadow-[0_0_50px_rgba(0,0,0,0.5)]"
            >
              <button onClick={() => setActiveTask(null)} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
              {modalMode === 'timer' ? (
                <div className="text-center">
                  <div className="mb-8"><h2 className="text-2xl font-bold text-white mb-2">{activeTask.title}</h2><p className="text-sm text-gray-500 font-mono uppercase tracking-widest">Protocol Active</p></div>
                  <div className="text-8xl font-mono font-bold text-white mb-10 tracking-tighter tabular-nums">{Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{Math.floor(timeLeft % 60).toString().padStart(2, '0')}</div>
                  <div className="flex gap-4">
                    <button onClick={() => setIsTimerRunning(!isTimerRunning)} className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isTimerRunning ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-primary text-black hover:bg-violet-400'}`}>
                      {isTimerRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />} {isTimerRunning ? "PAUSE" : "ENGAGE"}
                    </button>
                    <button onClick={() => setModalMode('verify')} className="px-6 border border-border rounded-xl hover:bg-white/5 text-green-500 hover:border-green-500/50 transition-all"><CheckCircle size={28} /></button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <h3 className="text-xl font-bold">Verification Required</h3>
                  <textarea className="w-full bg-black/50 border border-border rounded-xl p-4 h-32 focus:border-primary outline-none resize-none" placeholder="Describe your execution..." value={proof} onChange={(e) => setProof(e.target.value)} />
                  <div className="relative group">
                    <input type="file" accept="image/*" id="proof-upload" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { const base64 = reader.result.split(',')[1]; setProofImage(base64); }; reader.readAsDataURL(file); } }} />
                    <label htmlFor="proof-upload" className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${proofImage ? 'border-primary bg-primary/10' : 'border-border hover:border-gray-500 hover:bg-white/5'}`}>
                      {proofImage ? (<div className="flex items-center gap-2 text-primary font-bold"><CheckCircle size={20} /> Image Attached</div>) : (<span className="text-gray-500 text-xs uppercase tracking-widest group-hover:text-gray-300">Upload Visual Evidence</span>)}
                    </label>
                  </div>
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setModalMode('timer')} className="flex-1 py-3 rounded-xl bg-gray-800">Back</button>
                    <button onClick={handleVerify} disabled={loading} className="flex-1 py-3 rounded-xl bg-white text-black font-bold">{loading ? "Analyzing..." : "Confirm"}</button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- TOAST IS NOW HERE (Safe & Visible) --- */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            // UPDATED CLASSNAME BELOW:
            className={`absolute top-24 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl border backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-3 whitespace-nowrap max-w-[90vw] overflow-hidden text-ellipsis ${toast.type === 'success'
              ? 'bg-green-900/20 border-green-500/50 text-green-400'
              : toast.type === 'error'
                ? 'bg-red-900/20 border-red-500/50 text-red-400'
                : 'bg-primary/20 border-primary/50 text-primary-300'
              }`}
          >
            {toast.type === 'success' ? <Trophy size={18} /> : <Terminal size={18} />}
            <span className="font-mono text-sm font-bold tracking-wide uppercase truncate">
              {toast.message}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;