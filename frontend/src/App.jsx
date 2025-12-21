import { useState, useEffect, useRef } from 'react';
import { api } from './api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Flame, Target, CheckCircle, Loader2,
  Play, Pause, X, Terminal, LayoutGrid, BarChart3, Settings, AlertTriangle
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
// 1. IMPORT AUDIO HOOK
import { useDaemonAudio } from './hooks/useDaemonAudio';

// --- CSS FOR SCROLLBAR HIDING & MASKS ---
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

// --- COMPONENT: Timeline View (Updated Interaction) ---
const TimelineView = ({ tasks, openTask, playClick }) => {
  const [nowMinutes, setNowMinutes] = useState(getCurrentMinutes());
  // State for interaction: Hovered or Clicked (Selected)
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);

  const scrollRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => setNowMinutes(getCurrentMinutes()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      const pxPerMin = 4;
      const scrollPos = (nowMinutes * pxPerMin) - (window.innerWidth / 2);
      scrollRef.current.scrollLeft = scrollPos;
    }
  }, [scrollRef]);

  // 1. Determine "Active Directive" (The default one based on time)
  const timeActiveTask = tasks.find(t => {
    const start = timeToMinutes(t.scheduled_time);
    if (start === -1) return false;
    const end = start + t.estimated_time;
    return t.status !== 'completed' && nowMinutes >= (start - 15) && nowMinutes <= end;
  });

  // 2. Determine "Displayed Task" (Priority: Hover > Selected > Time Active)
  const displayId = hoveredTaskId || selectedTaskId;
  const displayTask = displayId ? tasks.find(t => t.id === displayId) : timeActiveTask;

  const pxPerMin = 4;

  return (
    <div className="w-full flex flex-col items-center justify-end h-full pb-[30vh] relative">
      <style>{globalStyles}</style>

      {/* --- LAYER A: THE POP-UP CARD (Inspection Area) --- */}
      <div className="mb-6 w-full max-w-xl px-6 h-40 flex items-end justify-center z-20">
        <AnimatePresence mode="wait">
          {displayTask ? (
            <motion.div
              key={displayTask.id}
              initial={{ y: 50, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.95 }}
              // CLICKING THE CARD LAUNCHES FOCUS MODE
              onClick={() => { playClick(); openTask(displayTask); }}
              className={`w-full backdrop-blur-xl border p-6 rounded-3xl shadow-[0_0_50px_rgba(124,58,237,0.4)] cursor-pointer group relative overflow-hidden transition-colors ${displayTask.id === selectedTaskId
                ? 'bg-surface border-primary' // Selected state
                : 'bg-surface/90 border-primary/50' // Default/Hover state
                }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-50" />

              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-widest mb-1">
                    {displayTask === timeActiveTask && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                      </span>
                    )}
                    {displayTask === timeActiveTask ? "Current Directive" : "Scheduled Directive"}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{displayTask.title}</h2>
                  {/* --- PASTE THIS BLOCK HERE --- */}
                  {displayTask.proof_instruction && (
                    <div className="flex items-start gap-2 text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg mt-2 mb-1 w-fit">
                      <Target size={14} className="mt-0.5 shrink-0" />
                      <span className="font-mono">{displayTask.proof_instruction}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-mono text-white font-bold">{displayTask.scheduled_time}</div>
                  <div className="text-[10px] text-gray-400 font-mono tracking-widest">{displayTask.estimated_time} MIN</div>
                </div>
              </div>

              {/* CTA changes based on context */}
              <div className="absolute bottom-4 right-6 text-xs text-primary/50 group-hover:text-primary transition-colors flex items-center gap-1 font-bold tracking-widest">
                CLICK TO INITIALIZE <Terminal size={12} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center pb-4"
            >
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">TIMELINE SYNCED</h2>
              <p className="text-gray-800 font-mono text-[10px] uppercase tracking-widest mt-1">No Immediate Directives</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* --- LAYER B: THE FADING TIMELINE --- */}
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto scrollbar-hide relative h-32 select-none timeline-mask"
      >
        <div className="relative h-full min-w-[5760px] flex items-center">

          {/* Axis */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/10 w-full" />

          {/* Hour Dots */}
          {[...Array(25)].map((_, i) => (
            <div key={i} className="absolute top-1/2" style={{ left: `${i * 60 * pxPerMin}px` }}>
              <div className="w-1.5 h-1.5 bg-gray-600 rounded-full -mt-[3px] -ml-[3px]" />
              <div className="absolute top-4 -left-3 text-[10px] font-mono text-gray-600 font-bold">
                {i.toString().padStart(2, '0')}:00
              </div>
            </div>
          ))}

          {/* Task Pills */}
          {tasks.map(task => {
            const start = timeToMinutes(task.scheduled_time);
            if (start === -1 || task.status === 'completed') return null;
            const width = Math.max(task.estimated_time * pxPerMin, 20);

            const isSelected = task.id === selectedTaskId;
            const isHovered = task.id === hoveredTaskId;

            return (
              <motion.div
                key={task.id}
                // INTERACTION LOGIC
                onClick={(e) => { e.stopPropagation(); playClick(); setSelectedTaskId(task.id); }}
                onMouseEnter={() => { playClick(); setHoveredTaskId(task.id); }} // Play faint click on hover? Optional
                onMouseLeave={() => setHoveredTaskId(null)}

                whileHover={{ y: -4, scale: 1.05 }}
                className={`absolute top-[35%] h-4 rounded-full cursor-pointer z-10 shadow-lg backdrop-blur-sm transition-all border ${isSelected ? 'bg-white border-white shadow-[0_0_20px_white]' :
                  task.is_urgent ? 'bg-red-500 border-red-400 shadow-[0_0_15px_red]' :
                    'bg-primary border-primary/50 shadow-[0_0_15px_#7c3aed]'
                  }`}
                style={{ left: `${start * pxPerMin}px`, width: `${width}px` }}
              />
            );
          })}

          {/* Playhead */}
          <div
            className="absolute top-0 bottom-0 z-30 pointer-events-none transition-all duration-1000 ease-linear"
            style={{ left: `${nowMinutes * pxPerMin}px` }}
          >
            <div className="absolute top-4 bottom-4 w-[1px] bg-gradient-to-b from-transparent via-red-500 to-transparent opacity-50" />
            <div className="absolute top-1/2 -mt-1.5 -ml-1.5 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_20px_red,0_0_40px_red]">
              <div className="absolute inset-0 bg-white rounded-full opacity-20 animate-ping" />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: Onboarding ---
const OnboardingModal = ({ onComplete }) => {
  const [formData, setFormData] = useState({ name: "", work_hours: "", core_goals: "", bad_habits: "" });
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const handleSubmit = async () => { setSubmitting(true); try { await api.onboardUser(formData); setTimeout(onComplete, 1500); } catch (e) { alert("Error"); setSubmitting(false); } };
  const steps = [{ label: "IDENTITY", field: "name", question: "Identify yourself, Operator.", placeholder: "e.g. Sid" }, { label: "PARAMETERS", field: "work_hours", question: "Define operational window.", placeholder: "e.g. 9:00 AM - 6:00 PM" }, { label: "OBJECTIVE", field: "core_goals", question: "State primary directive.", placeholder: "e.g. Learn AI" }, { label: "THREATS", field: "bad_habits", question: "List known vulnerabilities.", placeholder: "e.g. Doomscrolling" }];
  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-8 backdrop-blur-xl bg-black/80">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-xl bg-surface border border-primary/30 p-12 relative shadow-[0_0_100px_rgba(124,58,237,0.2)]">
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div><div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div><div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div><div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>
        {submitting ? <div className="text-center py-10"><Loader2 className="animate-spin w-12 h-12 text-primary mx-auto mb-4" /><h2 className="text-xl font-mono text-white animate-pulse">ESTABLISHING PROFILE...</h2></div> : (<><div className="mb-8"><span className="text-primary font-mono text-xs uppercase block mb-2">Sequence {step + 1}/{steps.length}</span><h1 className="text-3xl font-bold text-white">{steps[step].question}</h1></div><input autoFocus type="text" className="w-full bg-transparent border-b-2 border-gray-700 text-2xl py-2 text-white outline-none focus:border-primary font-mono" placeholder={steps[step].placeholder} value={formData[steps[step].field]} onChange={(e) => setFormData({ ...formData, [steps[step].field]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && formData[steps[step].field]) { step < steps.length - 1 ? setStep(step + 1) : handleSubmit() } }} /><button onClick={() => { step < steps.length - 1 ? setStep(step + 1) : handleSubmit() }} disabled={!formData[steps[step].field]} className="mt-8 bg-white text-black font-bold py-2 px-6 font-mono uppercase disabled:opacity-50">Next &gt;&gt;</button></>)}
      </motion.div>
    </div>
  );
};

// --- COMPONENT: Status Corner ---
const StatusCorner = ({ user }) => {
  const level = Math.floor(user.xp / 100) + 1;
  const progress = user.xp % 100;
  return (
    <div className="flex gap-4 items-center">
      <div className="w-12 h-12 bg-primary/20 rounded-lg border border-primary/50 flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]"><Terminal size={20} className="text-primary" /></div>
      <div><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-gray-400 tracking-wider">OPERATOR Lvl.{level}</span><span className="text-[10px] bg-primary/20 text-primary px-1.5 rounded border border-primary/20">{user.streak} DAY STREAK</span></div><div className="w-32 h-1.5 bg-gray-800 rounded-full overflow-hidden"><div className="h-full bg-primary shadow-[0_0_10px_#7c3aed]" style={{ width: `${progress}%` }} /></div></div>
    </div>
  );
};

// --- COMPONENT: Settings View ---
const SettingsView = ({ showToast, setIsConfigured, playClick }) => {
  const [key, setKey] = useState("");
  const [status, setStatus] = useState({ configured: false, masked: "Checking..." });
  const [saving, setSaving] = useState(false);
  useEffect(() => { api.getKeyStatus().then(setStatus).catch(console.error); }, []);
  const handleSave = async () => {
    if (!key) return; setSaving(true);
    try { const res = await api.saveKey(key); if (res.status === 'success') { showToast(res.message, "success"); setStatus({ configured: true, masked: "********" }); setIsConfigured(true); setKey(""); } else { showToast(res.message, "error"); } } catch (e) { showToast("Connection Error", "error"); }
    setSaving(false);
  };
  return (
    <div className="w-full max-w-2xl mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Settings className="text-primary" /> System Configuration</h2>
      <div className="bg-surface/50 border border-border p-8 rounded-3xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-8 p-4 bg-black/40 rounded-xl border border-white/5">
          <div><div className="text-xs text-gray-500 uppercase tracking-widest mb-1">Neural Link Status</div><div className={`font-mono font-bold ${status.configured ? 'text-green-500' : 'text-red-500'}`}>{status.configured ? "ONLINE" : "OFFLINE"}</div></div>
        </div>
        <div className="space-y-4"><label className="block text-sm text-gray-400 font-mono">GROQ API KEY</label><input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="gsk_..." className="w-full bg-black/50 border border-border rounded-xl p-4 pl-12 focus:border-primary outline-none text-white font-mono transition-all focus:ring-1 focus:ring-primary/50" /><div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"><Terminal size={18} /></div><button onClick={() => { playClick(); handleSave(); }} disabled={saving} className="w-full bg-white text-black font-bold py-4 rounded-xl mt-4 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">{saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />} {saving ? "Establishing Link..." : "Save Configuration"}</button></div>
      </div>
    </div>
  );
};

// --- COMPONENT: Analytics View ---
const AnalyticsView = () => {
  const [data, setData] = useState(null);
  useEffect(() => { api.getAnalytics().then(setData).catch(console.error); }, []);
  if (!data) return <div className="text-gray-500 mt-20 flex items-center gap-2"><Loader2 className="animate-spin" /> Accessing Data Logs...</div>;
  return (
    <div className="w-full max-w-4xl mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-surface/50 border border-border p-5 rounded-2xl backdrop-blur-md"><div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Success Rate</div><div className="text-3xl font-bold text-white">{data.stats.completion_rate}%</div></div>
        <div className="bg-surface/50 border border-border p-5 rounded-2xl backdrop-blur-md"><div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Missions Done</div><div className="text-3xl font-bold text-accent">{data.stats.total_completed}</div></div>
        <div className="bg-surface/50 border border-border p-5 rounded-2xl backdrop-blur-md"><div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Failed</div><div className="text-3xl font-bold text-red-500">{data.stats.total_failed}</div></div>
      </div>
      <div className="bg-surface/50 border border-border p-6 rounded-3xl backdrop-blur-md mb-6 flex flex-col items-center">
        <div className="w-full flex justify-between items-end mb-6 px-4">
          <h3 className="text-gray-400 text-sm font-mono uppercase tracking-widest">Consistency (28 Days)</h3>
          <div className="flex items-center gap-2 text-[10px] text-gray-600 font-mono"><span>LESS</span><div className="w-2 h-2 bg-white/5 rounded-full"></div><div className="w-2 h-2 bg-primary/40 rounded-full"></div><div className="w-2 h-2 bg-primary rounded-full"></div><div className="w-2 h-2 bg-white rounded-full shadow-[0_0_5px_white]"></div><span>MORE</span></div>
        </div>
        <div className="grid grid-cols-7 gap-3">
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (<div key={i} className="text-center text-[10px] text-gray-600 font-mono h-4">{d}</div>))}
          {data.heatmap_data && data.heatmap_data.map((day, i) => (
            <div key={i} className="group relative">
              <div className={`w-3 h-3 rounded-full transition-all duration-500 ${day.intensity === 0 ? 'bg-white/5' : day.intensity === 1 ? 'bg-primary/30' : day.intensity === 2 ? 'bg-primary/60 shadow-[0_0_5px_#7c3aed]' : day.intensity === 3 ? 'bg-primary shadow-[0_0_8px_#7c3aed]' : 'bg-white shadow-[0_0_10px_white]'}`}></div>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black border border-gray-700 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 font-mono">{day.date}: {day.count} Tasks</div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-surface/50 border border-border p-6 rounded-3xl backdrop-blur-md h-72 relative"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.chart_data}><defs><linearGradient id="colorFocus" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} /><stop offset="95%" stopColor="#7c3aed" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} /><XAxis dataKey="day" stroke="#4b5563" tick={{ fill: '#6b7280', fontSize: 12 }} tickLine={false} axisLine={false} /><YAxis hide /><Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', borderRadius: '8px' }} itemStyle={{ color: '#fff' }} /><Area type="monotone" dataKey="minutes" stroke="#7c3aed" strokeWidth={3} fillOpacity={1} fill="url(#colorFocus)" /></AreaChart></ResponsiveContainer></div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState({ xp: 0, streak: 0 });
  const [tasks, setTasks] = useState([]);
  const [isConfigured, setIsConfigured] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [modalMode, setModalMode] = useState('timer');
  const [proof, setProof] = useState("");
  const [proofImage, setProofImage] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [toast, setToast] = useState(null);

  // 2. INITIALIZE AUDIO
  const { playClick, playSuccess, playError, speak } = useDaemonAudio();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function loadData() {
      try {
        const data = await api.getDashboard();
        if (data.user) {
          setUser(data.user);
          if (data.user.name && data.user.name !== "Operator" && data.user.name !== "AlphaUser") setIsOnboarded(true);
        }
        if (data.tasks) setTasks(data.tasks);
        const keyStatus = await api.getKeyStatus();
        setIsConfigured(keyStatus.configured);
      } catch (e) { console.error(e); }
    }
    loadData();
  }, []);

  // 3. SYSTEM GREETING
  useEffect(() => {
    if (isConfigured) {
      setTimeout(() => {
        speak("System Online. Welcome back, Operator.");
      }, 1000);
    }
  }, [isConfigured, speak]);

  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    } else if (timeLeft === 0) setIsTimerRunning(false);
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handlePlan = async (e) => {
    if (e.key !== 'Enter' || !goal) return;
    if (!isConfigured) { showToast("ACCESS DENIED: Neural Link Required", "error"); playError(); return; }
    playClick(); // SFX
    setLoading(true);
    try {
      const res = await api.planDay(goal, 60);
      if (res.tasks) {
        setTasks(prev => [...prev, ...res.tasks]);
        setGoal("");
        showToast(`Protocol Initiated: ${res.tasks.length} New Directives`, "info");
        speak("Protocol Initiated."); // Voice
      }
    } catch (e) { showToast("Daemon Connection Failed", "error"); playError(); }
    setLoading(false);
  };

  const openTask = (task) => {
    playClick(); // SFX
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
      setTasks(prev => prev.map(t => t.id === activeTask.id ? { ...t, status: res.task_status } : t));
      if (res.task_status === 'completed' && res.reward) {
        setUser(prev => ({ ...prev, xp: res.reward.total_user_xp, streak: res.reward.current_streak }));
        showToast(`Mission Accomplished: +${res.reward.xp_gained} XP`, "success");
        playSuccess(); // SFX
        speak(`Mission Accomplished. ${res.reward.xp_gained} experience points awarded.`); // Voice
        setActiveTask(null);
      } else if (res.task_status === 'partial') {
        showToast(`Partial Credit: ${res.verification?.reason}`, "error");
        playError();
      } else {
        showToast(`Verification Rejected: ${res.verification?.reason}`, "error");
        playError();
        speak("Verification Rejected.");
      }
      setProof(""); setProofImage(null);
    } catch (e) { showToast("Verification System Failure", "error"); playError(); }
    setLoading(false);
  };

  return (
    <div className="h-screen w-screen bg-background text-gray-200 font-sans overflow-hidden relative selection:bg-primary/30">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {/* --- LEVEL 0: ONBOARDING GATE --- */}
      {!isOnboarded ? (
        <OnboardingModal onComplete={() => { setIsOnboarded(true); showToast("Identity Verified. Welcome, Operator.", "success"); playSuccess(); }} />
      ) : (
        <>
          {/* Top HUD */}
          <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-20">
            <StatusCorner user={user} />
          </div>

          {/* Bottom HUD */}
          <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end z-20 pointer-events-none">
            <div className="w-20"></div>
            <div className="flex-1 max-w-2xl mx-4 pointer-events-auto">
              <div className={`bg-surface/80 backdrop-blur-md border rounded-2xl p-1 flex items-center shadow-2xl ring-1 transition-all ${isConfigured ? "border-border ring-white/5" : "border-red-500/30 ring-red-500/20"}`}>
                <div className={`px-4 animate-pulse ${isConfigured ? "text-primary" : "text-red-500"}`}>{isConfigured ? <Terminal size={18} /> : <AlertTriangle size={18} />}</div>
                <input type="text" className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 h-12 font-medium" placeholder={loading ? "DAEMON is thinking..." : isConfigured ? "Enter directive..." : "SYSTEM OFFLINE // CONFIGURATION REQUIRED"} value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={handlePlan} disabled={loading} />
                {loading && <Loader2 className="animate-spin text-gray-500 mr-4" size={18} />}
              </div>
              <div className="text-center mt-2"><span className={`text-[10px] uppercase tracking-widest ${isConfigured ? "text-gray-600" : "text-red-500"}`}>{isConfigured ? "Daemon v1.0 • Ready for Input" : "Connection to Neural Net Severed"}</span></div>
            </div>
            <div className="flex gap-2 pointer-events-auto bg-surface/50 backdrop-blur-md p-2 rounded-2xl border border-border">
              <button onClick={() => { playClick(); setView('home'); }} className={`p-3 rounded-xl transition-all ${view === 'home' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}><LayoutGrid size={20} /></button>
              <button onClick={() => { playClick(); setView('analytics'); }} className={`p-3 rounded-xl transition-all ${view === 'analytics' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}><BarChart3 size={20} /></button>
              <button onClick={() => { playClick(); setView('settings'); }} className={`p-3 rounded-xl transition-all relative ${view === 'settings' ? 'bg-primary text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}>
                <Settings size={20} />{!isConfigured && (<span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_red]"></span>)}
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="absolute inset-0 pt-0 pb-0 overflow-hidden z-10">
            {view === 'analytics' ? (<div className="pt-32 px-8 h-full overflow-y-auto"><AnalyticsView /></div>) : view === 'settings' ? (<div className="pt-32 px-8 h-full overflow-y-auto"><SettingsView showToast={showToast} setIsConfigured={setIsConfigured} playClick={playClick} /></div>) : (
              <>
                {tasks.length === 0 && !loading ? (
                  <div className="flex flex-col items-center justify-center h-full pb-20">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                      <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">{isConfigured ? "DAEMON ONLINE." : <span className="text-gray-500">SYSTEM OFFLINE.</span>}</h1>
                      <p className="text-gray-500 text-lg max-w-md mx-auto">{isConfigured ? "Awaiting Directives. Type below to plan." : "Configuration required."}</p>
                    </motion.div>
                  </div>
                ) : (
                  <TimelineView tasks={tasks} openTask={openTask} playClick={playClick} />
                )}
              </>
            )}
          </div>

          {/* Modal */}
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
                        <button onClick={() => { playClick(); setIsTimerRunning(!isTimerRunning); }} className={`flex-1 py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isTimerRunning ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-primary text-black hover:bg-violet-400'}`}>{isTimerRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />} {isTimerRunning ? "PAUSE" : "ENGAGE"}</button>
                        <button onClick={() => { playClick(); setModalMode('verify'); }} className="px-6 border border-border rounded-xl hover:bg-white/5 text-green-500 hover:border-green-500/50 transition-all"><CheckCircle size={28} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <h3 className="text-xl font-bold">Verification Required</h3>
                      {/* --- PASTE THIS BLOCK HERE --- */}
                      {activeTask.last_failure_reason && (
                        <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl flex items-start gap-3 text-red-200 text-sm animate-pulse">
                          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold block text-xs uppercase tracking-widest text-red-500">Changes Requested</span>
                            {activeTask.last_failure_reason}
                          </div>
                        </div>
                      )}
                      <textarea className="w-full bg-black/50 border border-border rounded-xl p-4 h-32 focus:border-primary outline-none resize-none" placeholder="Describe your execution..." value={proof} onChange={(e) => setProof(e.target.value)} />
                      <div className="relative group">
                        <input type="file" accept="image/*" id="proof-upload" className="hidden" onChange={(e) => { const file = e.target.files[0]; if (file) { const reader = new FileReader(); reader.onloadend = () => { const base64 = reader.result.split(',')[1]; setProofImage(base64); playClick(); }; reader.readAsDataURL(file); } }} />
                        <label htmlFor="proof-upload" className={`h-24 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${proofImage ? 'border-primary bg-primary/10' : 'border-border hover:border-gray-500 hover:bg-white/5'}`}>{proofImage ? (<div className="flex items-center gap-2 text-primary font-bold"><CheckCircle size={20} /> Image Attached</div>) : (<span className="text-gray-500 text-xs uppercase tracking-widest group-hover:text-gray-300">Upload Visual Evidence</span>)}</label>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <button onClick={() => { playClick(); setModalMode('timer'); }} className="flex-1 py-3 rounded-xl bg-gray-800">Back</button>
                        <button onClick={() => { playClick(); handleVerify(); }} disabled={loading} className="flex-1 py-3 rounded-xl bg-white text-black font-bold">{loading ? "Analyzing..." : "Confirm"}</button>
                      </div>
                      {/* --- PASTE THIS BLOCK HERE --- */}
                      <div className="text-center mt-1">
                        <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest flex items-center justify-center gap-1">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                          Secure Uplink • Data Encrypted
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* --- TOAST --- */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }} className={`absolute top-24 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl border backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-3 whitespace-nowrap max-w-[90vw] overflow-hidden text-ellipsis ${toast.type === 'success' ? 'bg-green-900/20 border-green-500/50 text-green-400' : toast.type === 'error' ? 'bg-red-900/20 border-red-500/50 text-red-400' : 'bg-primary/20 border-primary/50 text-primary-300'}`}>
            {toast.type === 'success' ? <Trophy size={18} /> : toast.type === 'error' ? <AlertTriangle size={18} /> : <Terminal size={18} />}
            <span className="font-mono text-sm font-bold tracking-wide uppercase truncate">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;