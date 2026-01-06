import { useState, useEffect, useRef } from 'react';
import { api } from './api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Flame, Target, CheckCircle, Loader2, 
  Play, Pause, X, Terminal, LayoutGrid, BarChart3, Settings, AlertTriangle, Calendar, Radar
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useDaemonAudio } from './hooks/useDaemonAudio';

// --- STYLES ---
const globalStyles = `
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .timeline-mask { mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent); }
`;

// --- HELPERS ---
const timeToMinutes = (timeStr) => {
  if (!timeStr || timeStr.includes("Tomorrow") || timeStr === "Pending") return -1;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

const getDaysDifference = (targetDateStr) => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const target = new Date(targetDateStr);
    target.setHours(0,0,0,0);
    const diffTime = Math.abs(target - today);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

// --- COMPONENT: Spiral/Radar View (The Time Machine) ---
const SpiralView = ({ openTask }) => {
    const [tasks, setTasks] = useState([]);
    const [hoveredTask, setHoveredTask] = useState(null);

    useEffect(() => {
        api.getCalendar().then(setTasks).catch(console.error);
    }, []);

    // SVG Config
    const size = 600;
    const center = size / 2;
    const maxDays = 14; // How far into the future we see
    const dayGap = 20; // Pixels between days
    const innerRadius = 60; // Start of the spiral

    if (tasks.length === 0) return <div className="h-full flex items-center justify-center text-gray-500 font-mono"><Loader2 className="animate-spin mr-2"/> SCANNING TEMPORAL DATA...</div>;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center relative pb-20">
            {/* HUD Header */}
            <div className="absolute top-20 left-8 text-primary font-mono text-xs uppercase tracking-widest border-l-2 border-primary pl-3">
                <h3 className="font-bold text-white text-lg">TEMPORAL RADAR</h3>
                <p>Range: {maxDays} Days // Status: Active</p>
            </div>

            {/* The Task Pop-up (Hover) */}
            <AnimatePresence>
                {hoveredTask && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="absolute z-50 bg-black/90 border border-primary p-4 rounded-xl shadow-[0_0_30px_rgba(124,58,237,0.5)] max-w-xs pointer-events-none"
                        style={{ top: '20%', right: '10%' }}
                    >
                        <div className="text-xs text-gray-400 font-mono mb-1">{hoveredTask.target_date} @ {hoveredTask.scheduled_time}</div>
                        <div className="text-white font-bold text-lg leading-tight">{hoveredTask.title}</div>
                        <div className="text-primary text-xs mt-2 uppercase tracking-wider">Click to Initialize</div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* The Spiral SVG */}
            <div className="relative group">
                {/* Rotating Scanner Effect */}
                <div className="absolute inset-0 rounded-full border border-primary/20 animate-[spin_10s_linear_infinite]" />
                
                <svg width={size} height={size} className="overflow-visible">
                    {/* 1. Day Rings (Concentric Circles) */}
                    {[...Array(maxDays)].map((_, i) => (
                        <circle 
                            key={i} 
                            cx={center} cy={center} 
                            r={innerRadius + (i * dayGap)} 
                            fill="none" 
                            stroke="rgba(255,255,255,0.05)" 
                            strokeWidth="1"
                        />
                    ))}

                    {/* 2. Hour Spokes (0, 6, 12, 18) */}
                    {[0, 90, 180, 270].map((deg, i) => (
                        <line 
                            key={i}
                            x1={center} y1={center}
                            x2={center + (innerRadius + maxDays * dayGap) * Math.cos(deg * Math.PI / 180)}
                            y2={center + (innerRadius + maxDays * dayGap) * Math.sin(deg * Math.PI / 180)}
                            stroke="rgba(255,255,255,0.05)"
                            strokeWidth="1"
                        />
                    ))}

                    {/* 3. Task Blips */}
                    {tasks.map((task) => {
                        const mins = timeToMinutes(task.scheduled_time);
                        if (mins === -1) return null;
                        
                        const dayIndex = getDaysDifference(task.target_date);
                        if (dayIndex >= maxDays) return null;

                        // Math: Map 24h to 360 degrees (0 = Midnight at -90deg/Top)
                        // -90 offsets it so 00:00 is at Top
                        const angle = ((mins / 1440) * 360) - 90; 
                        const rad = (angle * Math.PI) / 180;
                        const radius = innerRadius + (dayIndex * dayGap);

                        const x = center + radius * Math.cos(rad);
                        const y = center + radius * Math.sin(rad);

                        let color = "#7c3aed"; // Default Primary
                        if (task.is_urgent) color = "#ef4444"; // Red
                        if (task.priority === 'high') color = "#f59e0b"; // Gold

                        return (
                            <g key={task.id} 
                               onClick={() => openTask(task)}
                               onMouseEnter={() => setHoveredTask(task)}
                               onMouseLeave={() => setHoveredTask(null)}
                               className="cursor-pointer hover:opacity-100 transition-opacity"
                            >
                                {/* Glow */}
                                <circle cx={x} cy={y} r="6" fill={color} fillOpacity="0.3" className="animate-pulse" />
                                {/* Core */}
                                <circle cx={x} cy={y} r="3" fill={color} />
                            </g>
                        );
                    })}
                </svg>
                
                {/* Center Label */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="text-[10px] font-mono text-gray-500">ORIGIN</div>
                    <div className="text-xl font-bold text-white">NOW</div>
                </div>
            </div>
        </div>
    );
};

// --- (Keep TimelineView, OnboardingModal, StatusCorner, SettingsView, AnalyticsView EXACTLY AS THEY WERE) ---
// I am omitting them here to save space, but DO NOT DELETE THEM in your file. 
// Just ensure SpiralView is added above App.

// --- MAIN APP COMPONENT ---
function App() {
  const [view, setView] = useState('home'); // 'home', 'analytics', 'settings', 'calendar'
  
  // ... (All existing state: user, tasks, etc) ...
  const [user, setUser] = useState({ name: "Player", xp: 0, streak: 0 });
  const [tasks, setTasks] = useState([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [appReady, setAppReady] = useState(false);

  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [modalMode, setModalMode] = useState('timer'); 
  const [proof, setProof] = useState("");
  const [proofImage, setProofImage] = useState(null); 
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [toast, setToast] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  const { playClick, playSuccess, playError, speak } = useDaemonAudio();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ... (Keep All useEffects for LoadData, Greeting, Timer, Notifications) ...
  // --- COPY-PASTE YOUR EXISTING useEffects HERE ---
  useEffect(() => {
    async function init() {
        try {
            if (Notification.permission !== "granted") Notification.requestPermission();
            const keyStatus = await api.getKeyStatus();
            setIsConfigured(keyStatus.configured);
            if (keyStatus.configured) {
                const data = await api.getDashboard();
                if (data.user) {
                    setUser(data.user);
                    if (data.user.name && data.user.name !== "Operator" && data.user.name !== "Player" && data.user.name !== "AlphaUser") setIsOnboarded(true);
                }
                if (data.tasks) setTasks(data.tasks);
            }
        } catch (e) { console.error(e); }
        setAppReady(true);
    }
    init();
  }, []);

  useEffect(() => {
    if (appReady && isOnboarded && isConfigured) setTimeout(() => speak(`DAEMON Online. Welcome back, ${user.name}.`), 1000);
  }, [appReady, isConfigured, isOnboarded]);

  useEffect(() => {
    const checkReminders = setInterval(() => {
        const now = new Date();
        const currentHM = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        tasks.forEach(t => {
            if (t.status !== 'completed' && t.scheduled_time === currentHM) {
                new Notification("MISSION START", { body: `Objective: ${t.title}`, silent: false });
                playClick(); speak(`Mission ${t.title} commencing now.`);
            }
        });
    }, 60000); 
    return () => clearInterval(checkReminders);
  }, [tasks]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    else if (timeLeft === 0) setIsTimerRunning(false);
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  // ... (Keep handlePlan, openTask, handleVerify) ...
  const handlePlan = async (e) => {
    if (e.key !== 'Enter' || !goal) return;
    if (!isConfigured) { showToast("ACCESS DENIED: Neural Link Required", "error"); playError(); return; }
    playClick(); setLoading(true);
    try {
      const res = await api.planDay(goal, 60);
      if (res.tasks) {
        setTasks(prev => [...prev, ...res.tasks]); 
        setGoal("");
        showToast(`New Mission Acquired: ${res.tasks.length} Objectives`, "info");
        speak("Mission parameters logged.");
      }
    } catch (e) { showToast("Daemon Connection Failed", "error"); playError(); }
    setLoading(false);
  };

  const openTask = (task) => {
    playClick();
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
      if (res.status === 'locked') { setIsLocked(true); setLockMessage(res.verification?.reason || res.message); setActiveTask(null); playError(); setLoading(false); return; }
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, status: res.task_status } : t));
      if (res.task_status === 'completed' && res.reward) {
        setUser(prev => ({ ...prev, xp: res.reward.total_user_xp, streak: res.reward.current_streak }));
        showToast(`Mission Passed: +${res.reward.xp_gained} XP`, "success");
        playSuccess(); speak(`Mission Accomplished. ${res.reward.xp_gained} experience points awarded.`);
        setActiveTask(null);
      } else { showToast(`Correction Needed: ${res.verification?.reason}`, "error"); playError(); speak("Correction Needed."); }
      setProof(""); setProofImage(null);
    } catch (e) { showToast("Verification Failed", "error"); playError(); }
    setLoading(false);
  };

  if (!appReady) return <div className="h-screen w-screen bg-background flex items-center justify-center text-primary"><Loader2 className="animate-spin w-8 h-8"/></div>;

  return (
    <div className="h-screen w-screen bg-background text-gray-200 font-sans overflow-hidden relative selection:bg-primary/30">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {!isConfigured ? ( <SetupView onComplete={() => { setIsConfigured(true); showToast("Neural Link Established", "success"); playSuccess(); }} /> ) : 
      !isOnboarded ? ( <OnboardingModal onComplete={() => { setIsOnboarded(true); showToast("Profile Created. Welcome.", "success"); playSuccess(); }} /> ) : (
         <>
            {/* Top HUD */}
            <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-20"><StatusCorner user={user} /></div>

            {/* Bottom HUD (Dock) */}
            <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end z-20 pointer-events-none">
                <div className="w-20"></div> 
                <div className="flex-1 max-w-2xl mx-4 pointer-events-auto">
                    <div className={`bg-surface/80 backdrop-blur-md border rounded-2xl p-1 flex items-center shadow-2xl ring-1 transition-all ${isConfigured ? "border-border ring-white/5" : "border-red-500/30 ring-red-500/20"}`}>
                        <div className={`px-4 animate-pulse ${isConfigured ? "text-primary" : "text-red-500"}`}>{isConfigured ? <Terminal size={18} /> : <AlertTriangle size={18} />}</div>
                        <input type="text" className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 h-12 font-medium" placeholder={loading ? "DAEMON is thinking..." : isConfigured ? "Enter mission objective..." : "SYSTEM OFFLINE"} value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={handlePlan} disabled={loading} />
                        {loading && <Loader2 className="animate-spin text-gray-500 mr-4" size={18}/>}
                    </div>
                </div>
                <div className="flex gap-2 pointer-events-auto bg-surface/50 backdrop-blur-md p-2 rounded-2xl border border-border">
                    <button onClick={() => { playClick(); setView('home'); }} className={`p-3 rounded-xl transition-all ${view === 'home' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}><LayoutGrid size={20} /></button>
                    {/* NEW: CALENDAR BUTTON */}
                    <button onClick={() => { playClick(); setView('calendar'); }} className={`p-3 rounded-xl transition-all ${view === 'calendar' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}><Calendar size={20} /></button>
                    <button onClick={() => { playClick(); setView('analytics'); }} className={`p-3 rounded-xl transition-all ${view === 'analytics' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}><BarChart3 size={20} /></button>
                    <button onClick={() => { playClick(); setView('settings'); }} className={`p-3 rounded-xl transition-all relative ${view === 'settings' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}>
                        <Settings size={20} />{!isConfigured && (<span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]"></span>)}
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="absolute inset-0 pt-0 pb-0 overflow-hidden z-10">
                {view === 'analytics' ? ( <div className="pt-32 px-8 h-full overflow-y-auto"><AnalyticsView /></div> ) 
                : view === 'settings' ? ( <div className="pt-32 px-8 h-full overflow-y-auto"><SettingsView showToast={showToast} setIsConfigured={setIsConfigured} playClick={playClick} /></div> ) 
                : view === 'calendar' ? ( <SpiralView openTask={(task) => { openTask(task); playClick(); }} /> ) 
                : (
                    <>
                        {tasks.length === 0 && !loading ? (
                            <div className="flex flex-col items-center justify-center h-full pb-20">
                                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                                    <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">KRYTA ONLINE.</h1>
                                    <p className="text-gray-500 text-lg max-w-md mx-auto">Awaiting mission parameters.</p>
                                </motion.div>
                            </div>
                        ) : (
                            <TimelineView tasks={tasks} openTask={openTask} playClick={playClick} />
                        )}
                    </>
                )}
            </div>

            {/* Modal & Toast (Keep Existing) */}
            <AnimatePresence>
                {activeTask && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50">
                    <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="w-full max-w-lg bg-surface border border-border p-8 rounded-3xl relative shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                        <button onClick={() => { playClick(); setActiveTask(null); }} className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors"><X size={24} /></button>
                        {modalMode === 'timer' ? (
                            <div className="text-center">
                                <div className="mb-8"><h2 className="text-2xl font-bold text-white mb-2">{activeTask.title}</h2><p className="text-sm text-gray-500 font-mono uppercase tracking-widest">Protocol Active</p></div>
                                <div className="text-8xl font-mono font-bold text-white mb-10 tracking-tighter tabular-nums">{Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{Math.floor(timeLeft % 60).toString().padStart(2, '0')}</div>
                                <div className="flex gap-4">
                                    <button onClick={() => { playClick(); setIsTimerRunning(!isTimerRunning); }} className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isTimerRunning ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-primary text-black hover:bg-violet-400'}`}>{isTimerRunning ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor"/>} {isTimerRunning ? "PAUSE" : "ENGAGE"}</button>
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
                                <textarea className="w-full bg-black/50 border border-border rounded-xl p-4 h-32 focus:border-primary outline-none resize-none" placeholder="Describe your execution..." value={proof} onChange={(e) => setProof(e.target.value)}/>
                                <div className="relative group">
                                    <input type="file" accept="image/*" id="proof-upload" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { const base64 = reader.result.split(',')[1]; setProofImage(base64); playClick(); }; reader.readAsDataURL(file); }}} />
                                    <label htmlFor="proof-upload" className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${proofImage ? 'border-primary bg-primary/10' : 'border-border hover:border-gray-500 hover:bg-white/5'}`}>{proofImage ? (<div className="flex items-center gap-2 text-primary font-bold"><CheckCircle size={20} /> Image Attached</div>) : (<span className="text-gray-500 text-xs uppercase tracking-widest group-hover:text-gray-300">Upload Visual Evidence</span>)}</label>
                                </div>
                                <div className="flex gap-3 mt-4">
                                    <button onClick={() => { playClick(); setModalMode('timer'); }} className="flex-1 py-3 rounded-xl bg-gray-800">Back</button>
                                    <button onClick={() => { playClick(); handleVerify(); }} disabled={loading} className="flex-1 py-3 rounded-xl bg-white text-black font-bold">{loading ? "Analyzing..." : "Confirm"}</button>
                                </div>
                                <div className="text-center mt-1"><p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest flex items-center justify-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Secure Uplink • Data Encrypted</p></div>
                            </div>
                        )}
                    </motion.div>
                </div>
                )}
            </AnimatePresence>
         </>
      )}

      {/* Toast & Lockdown overlays... */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }} className={`absolute top-24 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl border backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-3 whitespace-nowrap max-w-[90vw] overflow-hidden text-ellipsis ${toast.type === 'success' ? 'bg-green-900/20 border-green-500/50 text-green-400' : toast.type === 'error' ? 'bg-red-900/20 border-red-500/50 text-red-400' : 'bg-primary/20 border-primary/50 text-primary-300'}`}>
            {toast.type === 'success' ? <Trophy size={18} /> : toast.type === 'error' ? <AlertTriangle size={18} /> : <Terminal size={18} />}
            <span className="font-mono text-sm font-bold tracking-wide uppercase truncate">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isLocked && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[200] bg-red-950/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-8">
                <div className="mb-6 animate-pulse"><AlertTriangle size={80} className="text-red-500" /></div>
                <h1 className="text-5xl font-black text-red-500 tracking-tighter mb-4 glitch-text">SYSTEM OVERHEAT</h1>
                <p className="text-red-200 font-mono text-xl max-w-lg border-t border-b border-red-500/30 py-4">{lockMessage || "TOO MANY FAILED ATTEMPTS. COOLING DOWN NEURAL LINK."}</p>
                <p className="mt-8 text-red-400/50 text-sm font-mono uppercase tracking-widest">PLEASE STEP AWAY FROM THE TERMINAL</p>
                <button onClick={() => setIsLocked(false)} className="mt-12 text-xs text-red-900 hover:text-red-500 transition-colors">[ ACKNOWLEDGE ]</button>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;