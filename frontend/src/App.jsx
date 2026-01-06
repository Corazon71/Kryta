import { useState, useEffect, useRef } from 'react';
import { api } from './api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Flame, Target, CheckCircle, Loader2,
  Play, Pause, X, Terminal, LayoutGrid, BarChart3, Settings, AlertTriangle, Calendar, Radar
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useKRYTAAudio } from './hooks/useKRYTAAudio';

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
  today.setHours(0, 0, 0, 0);
  const target = new Date(targetDateStr);
  target.setHours(0, 0, 0, 0);
  const diffTime = Math.abs(target - today);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// --- COMPONENT: Spiral/Radar View (Final Layout) ---
const SpiralView = ({ openTask, playClick }) => {
  const [tasks, setTasks] = useState([]);
  const [hoveredTask, setHoveredTask] = useState(null);
  const [maxDays, setMaxDays] = useState(7);

  useEffect(() => {
    api.getCalendar().then(setTasks).catch(console.error);
  }, []);

  // --- MATH HELPERS ---
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);
    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");
  };

  // SVG Config
  const size = 600;
  const center = size / 2;
  const innerRadius = 50;
  const dayGap = Math.min(35, 230 / maxDays);

  const handleScroll = (e) => {
    if (e.deltaY > 0) setMaxDays(prev => Math.min(30, prev + 1));
    else setMaxDays(prev => Math.max(7, prev - 1));
  };

  const getDateLabel = (offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return offset === 0 ? "TODAY" : offset === 1 ? "TOMORROW" : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase();
  };

  const timeToMinutes = (timeStr) => {
    if (!timeStr) return -1;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours * 60) + minutes;
  };

  if (tasks.length === 0) return <div className="h-full flex items-center justify-center text-gray-500 font-mono"><Loader2 className="animate-spin mr-2" /> SCANNING TEMPORAL DATA...</div>;

  return (
    <div
      onWheel={handleScroll}
      className="w-full h-full flex flex-col items-center justify-center relative pb-20 overflow-hidden cursor-ns-resize"
    >

      {/* 1. TOP-RIGHT: TASK DETAIL BOX (Visible on Hover) */}
      <AnimatePresence>
        {hoveredTask && (
          <motion.div
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="absolute top-12 right-8 z-50 bg-surface/90 border border-primary/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(124,58,237,0.3)] max-w-sm backdrop-blur-xl pointer-events-none"
          >
            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2 justify-end">
              <span className="text-gray-400 font-mono text-xs mr-auto">{hoveredTask.scheduled_time}</span>
              <span className="text-primary font-mono text-xs font-bold tracking-widest">{hoveredTask.target_date}</span>
              <div className={`w-2 h-2 rounded-full ${hoveredTask.is_urgent ? 'bg-red-500' : 'bg-primary'} animate-pulse`}></div>
            </div>

            <h2 className="text-2xl font-bold text-white leading-tight mb-2 text-right">{hoveredTask.title}</h2>
            <div className="flex gap-4 text-xs font-mono text-gray-500 uppercase justify-end">
              <span>PRIORITY: {hoveredTask.priority.toUpperCase()}</span>
              <span>EST: {hoveredTask.estimated_time} MIN</span>
            </div>

            <div className="mt-4 text-right">
              <div className="text-[10px] text-primary/70 border border-primary/20 rounded px-2 py-1 inline-block">
                CLICK TO INITIALIZE
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. BOTTOM-LEFT: HUD HEADER */}
      <div className="absolute bottom-12 left-8 border-l-2 border-primary pl-4 pointer-events-none z-10 transition-all text-left">
        <h3 className="font-bold text-white text-2xl tracking-tighter">TEMPORAL RADAR</h3>
        <p className="text-primary font-mono text-xs uppercase tracking-widest mt-1">SCAN RANGE: {maxDays} DAYS</p>
        <p className="text-gray-500 font-mono text-[9px] mt-1 opacity-50 uppercase tracking-tighter">SCROLL TO EXPAND RANGE</p>
        <div className="mt-2 flex items-center justify-start gap-2 text-[10px] text-gray-500 font-mono">
          <span className="w-2 h-2 rounded-full bg-primary"></span> ROUTINE
          <span className="w-2 h-2 rounded-full bg-red-500 ml-2"></span> URGENT
        </div>
      </div>

      {/* 3. CENTER: The Radar SVG */}
      <div className="relative group scale-90 lg:scale-100 transition-transform">
        <div className="absolute inset-0 rounded-full border border-primary/5 animate-[spin_10s_linear_infinite] pointer-events-none" style={{ maskImage: 'conic-gradient(from 0deg, transparent 0deg, black 360deg)' }} />

        <svg width={size} height={size} className="overflow-visible">
          <defs>
            <radialGradient id="radar-glow" cx="0.5" cy="0.5" r="0.5">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          <circle cx={center} cy={center} r={innerRadius + (maxDays * dayGap)} fill="url(#radar-glow)" />

          {/* Date Rings */}
          {[...Array(maxDays)].map((_, i) => {
            const r = innerRadius + (i * dayGap);
            const showLabel = maxDays <= 10 || i % 5 === 0 || i === maxDays - 1;
            return (
              <g key={`ring-${i}`}>
                <circle cx={center} cy={center} r={r} fill="none" stroke={i === 0 ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)"} strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4 4"} />
                {showLabel && (
                  <text x={center} y={center - r - 5} textAnchor="middle" fill={i === 0 ? "#7c3aed" : "#4b5563"} fontSize="9" fontFamily="monospace" fontWeight="bold">
                    {getDateLabel(i)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Time Spokes (12 PM Top) */}
          {[
            { deg: 0, label: "12 PM" },
            { deg: 90, label: "6 PM" },
            { deg: 180, label: "12 AM" },
            { deg: 270, label: "6 AM" }
          ].map((spoke, i) => {
            const rMax = innerRadius + (maxDays * dayGap);
            const angleRad = (spoke.deg - 90) * Math.PI / 180;
            const textX = center + (rMax + 20) * Math.cos(angleRad);
            const textY = center + (rMax + 20) * Math.sin(angleRad);

            return (
              <g key={`spoke-${i}`}>
                <line x1={center} y1={center} x2={center + rMax * Math.cos(angleRad)} y2={center + rMax * Math.sin(angleRad)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                <text x={textX} y={textY + 5} textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace" fontWeight="bold">
                  {spoke.label}
                </text>
              </g>
            );
          })}

          {/* Task Arcs */}
          {tasks.map((task) => {
            const mins = timeToMinutes(task.scheduled_time);
            if (mins === -1) return null;

            const today = new Date(); today.setHours(0, 0, 0, 0);
            const target = new Date(task.target_date); target.setHours(0, 0, 0, 0);
            const diffTime = target - today;
            const dayIndex = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (dayIndex < 0 || dayIndex >= maxDays) return null;

            // Solar Mapping (12 PM = 0 deg)
            const solarMins = (mins + 720) % 1440;
            const startAngle = (solarMins / 1440) * 360;
            const durationDegrees = Math.max((task.estimated_time / 1440) * 360, 2);
            const endAngle = startAngle + durationDegrees;

            const radius = innerRadius + (dayIndex * dayGap);

            let color = "#7c3aed";
            if (task.is_urgent) color = "#ef4444";
            if (task.priority === 'high') color = "#f59e0b";

            const isHovered = hoveredTask && hoveredTask.id === task.id;

            return (
              <g key={task.id}
                onClick={() => { playClick(); openTask(task); }}
                onMouseEnter={() => { playClick(); setHoveredTask(task); }}
                onMouseLeave={() => setHoveredTask(null)}
                className="cursor-pointer"
              >
                {/* Visual Arc */}
                <path
                  d={describeArc(center, center, radius, startAngle, endAngle)}
                  fill="none"
                  stroke={isHovered ? "#ffffff" : color}
                  strokeWidth={isHovered ? "6" : "3"}
                  strokeLinecap="round"
                  className="transition-all duration-200 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]"
                />
                {/* Hit Area (Invisible, Wider) */}
                <path
                  d={describeArc(center, center, radius, startAngle, endAngle)}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="20" // Increased from 15 to 20 for easier hovering
                />
              </g>
            );
          })}

          <circle cx={center} cy={center} r="5" fill="#fff" className="animate-pulse" />
        </svg>
      </div>
    </div>
  );
};

// --- COMPONENT: Timeline View ---
const TimelineView = ({ tasks, openTask, playClick }) => {
  const [nowMinutes, setNowMinutes] = useState(getCurrentMinutes());
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

  const timeActiveTask = tasks.find(t => {
    const start = timeToMinutes(t.scheduled_time);
    if (start === -1) return false;
    const end = start + t.estimated_time;
    return t.status !== 'completed' && nowMinutes >= (start - 15) && nowMinutes <= end;
  });

  const displayId = hoveredTaskId || selectedTaskId;
  const displayTask = displayId ? tasks.find(t => t.id === displayId) : timeActiveTask;
  const pxPerMin = 4;

  return (
    <div className="w-full flex flex-col items-center justify-end h-full pb-[30vh] relative">
      <style>{globalStyles}</style>

      {/* Pop-up Card */}
      <div className="mb-6 w-full max-w-xl px-6 h-40 flex items-end justify-center z-20">
        <AnimatePresence mode="wait">
          {displayTask ? (
            <motion.div
              key={displayTask.id}
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              onClick={() => { playClick(); openTask(displayTask); }}
              className={`w-full backdrop-blur-xl border p-6 rounded-3xl cursor-pointer group relative overflow-hidden transition-colors ${displayTask.id === selectedTaskId ? 'bg-surface border-primary' : 'bg-surface/90 border-primary/50'
                }`}
            >
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 text-primary font-mono text-[10px] uppercase tracking-widest mb-1">
                    {displayTask === timeActiveTask && (<span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-primary opacity-75" /><span className="relative rounded-full h-2 w-2 bg-primary" /></span>)}
                    {displayTask === timeActiveTask ? "Current Mission" : "Scheduled Mission"}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">{displayTask.title}</h2>
                  {displayTask.proof_instruction && (
                    <div className="flex items-start gap-2 text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg mt-2 w-fit">
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
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pb-4">
              <h2 className="text-2xl font-bold text-gray-800 tracking-tight">TIMELINE CLEAR</h2>
              <p className="text-gray-800 font-mono text-[10px] uppercase tracking-widest mt-1">Standby Mode // Monitoring</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timeline Strip */}
      <div ref={scrollRef} className="w-full overflow-x-auto scrollbar-hide relative h-32 select-none timeline-mask">
        <div className="relative h-full min-w-[5760px] flex items-center">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/10 w-full" />
          {[...Array(25)].map((_, i) => (<div key={i} className="absolute top-1/2" style={{ left: `${i * 60 * pxPerMin}px` }}><div className="w-1.5 h-1.5 bg-gray-600 rounded-full -mt-[3px] -ml-[3px]" /><div className="absolute top-4 -left-3 text-[10px] font-mono text-gray-600 font-bold">{i.toString().padStart(2, '0')}:00</div></div>))}
          {tasks.map(task => {
            const start = timeToMinutes(task.scheduled_time);
            if (start === -1 || task.status === 'completed') return null;
            const width = Math.max(task.estimated_time * pxPerMin, 20);
            let colorClass = "bg-primary border-primary/50 shadow-[0_0_15px_#7c3aed]";
            if (task.is_urgent) { colorClass = "bg-red-500 border-red-400 shadow-[0_0_15px_red]"; }
            else if (task.priority === 'high') { colorClass = "bg-amber-500 border-amber-400 shadow-[0_0_15px_#f59e0b]"; }
            return (
              <motion.div key={task.id} onClick={(e) => { e.stopPropagation(); playClick(); setSelectedTaskId(task.id); }} onMouseEnter={() => setHoveredTaskId(task.id)} onMouseLeave={() => setHoveredTaskId(null)} whileHover={{ y: -4, scale: 1.05 }} className={`absolute top-[35%] h-4 rounded-full cursor-pointer z-10 shadow-lg backdrop-blur-sm transition-all border ${colorClass}`} style={{ left: `${start * pxPerMin}px`, width: `${width}px` }} />
            );
          })}
          <div className="absolute top-0 bottom-0 z-30 pointer-events-none" style={{ left: `${nowMinutes * pxPerMin}px` }}>
            <div className="absolute top-4 bottom-4 w-[1px] bg-gradient-to-b from-transparent via-red-500 to-transparent opacity-50" />
            <div className="absolute top-1/2 -mt-1.5 -ml-1.5 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_20px_red,0_0_40px_red]"><div className="absolute inset-0 bg-white rounded-full opacity-20 animate-ping" /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: Initial Setup (Stage 1) ---
const SetupView = ({ onComplete }) => {
  const [key, setKey] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");

  const handleVerify = async () => {
    setVerifying(true);
    setError("");
    try {
      const res = await api.saveKey(key);
      if (res.status === 'success') {
        onComplete(); // Move to Stage 2
      } else {
        setError(res.message || "Invalid Key");
      }
    } catch (e) { setError("Connection Failed"); }
    setVerifying(false);
  };

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-8 bg-background text-center">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full">
        <Terminal size={48} className="text-primary mx-auto mb-6 animate-pulse" />
        <h1 className="text-3xl font-bold text-white mb-2">SYSTEM OFFLINE</h1>
        <p className="text-gray-500 font-mono text-sm mb-8">NEURAL LINK REQUIRED TO PROCEED</p>

        <div className="bg-surface border border-border p-6 rounded-2xl relative overflow-hidden">
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="ENTER GROQ API KEY" className="w-full bg-black/50 border border-border rounded-xl p-4 text-center text-white font-mono tracking-widest outline-none focus:border-primary mb-4" />

          {error && <div className="text-red-500 text-xs font-mono mb-4">{error}</div>}

          <button onClick={handleVerify} disabled={verifying || !key} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50">
            {verifying ? <Loader2 className="animate-spin mx-auto" /> : "INITIALIZE SYSTEM"}
          </button>
        </div>
        <div className="mt-8 text-xs text-gray-700 font-mono">KRYTA v3.0 // SECURITY CHECKPOINT</div>
      </motion.div>
    </div>
  );
};

// --- COMPONENT: Onboarding (Stage 2) ---
const OnboardingModal = ({ onComplete }) => {
  const [formData, setFormData] = useState({ name: "", work_hours: "", bad_habits: "", core_goals: "" });
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try { await api.onboardUser(formData); setTimeout(onComplete, 1000); }
    catch (e) { alert("Error"); setSubmitting(false); }
  };

  const steps = [
    { label: "IDENTITY", field: "name", question: "Enter Player Name.", placeholder: "e.g. Ash" },
    { label: "RESTRICTED ZONES", field: "work_hours", question: "When are you busy? (Work/School)", placeholder: "e.g. Mon-Fri 9am-5pm" },
    { label: "MAINTENANCE", field: "bad_habits", question: "When do you Sleep and Eat?", placeholder: "e.g. Sleep 11pm-7am, Lunch 1pm" },
    { label: "MAIN QUEST", field: "core_goals", question: "What is your main goal for 2025?", placeholder: "e.g. Get Fit, Learn Coding" }
  ];

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-8 bg-background">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-xl bg-surface border border-primary/30 p-12 relative shadow-[0_0_100px_rgba(124,58,237,0.2)] z-10">
        {submitting ? <div className="text-center py-10"><Loader2 className="animate-spin w-12 h-12 text-primary mx-auto mb-4" /><h2 className="text-xl font-mono text-white animate-pulse">CREATING PROFILE...</h2></div> : (<><div className="mb-8"><span className="text-primary font-mono text-xs uppercase block mb-2">Initialization {step + 1}/{steps.length}</span><h1 className="text-3xl font-bold text-white">{steps[step].question}</h1></div><input autoFocus type="text" className="w-full bg-transparent border-b-2 border-gray-700 text-2xl py-2 text-white outline-none focus:border-primary font-mono" placeholder={steps[step].placeholder} value={formData[steps[step].field]} onChange={(e) => setFormData({ ...formData, [steps[step].field]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && formData[steps[step].field]) { step < steps.length - 1 ? setStep(step + 1) : handleSubmit() } }} /><button onClick={() => { step < steps.length - 1 ? setStep(step + 1) : handleSubmit() }} disabled={!formData[steps[step].field]} className="mt-8 bg-white text-black font-bold py-2 px-6 font-mono uppercase disabled:opacity-50">Next &gt;&gt;</button></>)}
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
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);
  useEffect(() => { api.getAnalytics().then(setData).catch(console.error); }, []);
  const handleGenerateReport = async () => { setGenerating(true); try { const res = await api.generateReport(); setReport(res); } catch (e) { alert("Analysis Failed"); } setGenerating(false); };
  if (!data) return <div className="text-gray-500 mt-20 flex items-center gap-2"><Loader2 className="animate-spin" /> Accessing Data Logs...</div>;
  const trustColor = data.stats.trust_score > 80 ? 'text-green-500' : data.stats.trust_score > 50 ? 'text-yellow-500' : 'text-red-500';
  return (
    <div className="w-full max-w-4xl mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-surface/50 border border-border p-5 rounded-2xl backdrop-blur-md col-span-1"><div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Success Rate</div><div className="text-3xl font-bold text-white">{data.stats.completion_rate}%</div></div>
        <div className="bg-surface/50 border border-border p-5 rounded-2xl backdrop-blur-md col-span-2 flex items-center justify-between relative overflow-hidden"><div className="relative z-10"><div className="text-gray-500 text-xs uppercase tracking-widest mb-1 flex items-center gap-2"><Target size={12} /> System Trust Level</div><div className={`text-4xl font-mono font-bold ${trustColor} tracking-tighter`}>{data.stats.trust_score}%</div></div><div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden"><div className={`h-full ${data.stats.trust_score > 80 ? 'bg-green-500' : 'bg-red-500'} transition-all duration-1000`} style={{ width: `${data.stats.trust_score}%` }} /></div><div className={`absolute right-0 top-0 bottom-0 w-1 ${data.stats.trust_score > 80 ? 'bg-green-500' : 'bg-red-500'} opacity-20`} /></div>
        <div className="bg-surface/50 border border-border p-5 rounded-2xl backdrop-blur-md col-span-1"><div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Failed</div><div className="text-3xl font-bold text-red-500">{data.stats.total_failed}</div></div>
      </div>
      <div className="bg-surface/50 border border-border p-6 rounded-3xl backdrop-blur-md mb-6 min-h-[160px]">
        <div className="flex justify-between items-start mb-4"><h3 className="text-gray-400 text-sm font-mono uppercase tracking-widest flex items-center gap-2"><Terminal size={14} /> Tactical Debrief</h3>{!report && (<button onClick={handleGenerateReport} disabled={generating} className="bg-primary/20 text-primary border border-primary/50 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/30 transition-colors flex items-center gap-2">{generating ? <Loader2 size={12} className="animate-spin" /> : "GENERATE REPORT"}</button>)}</div>
        {report ? (<div className="animate-in fade-in slide-in-from-left-2"><div className="flex items-center gap-3 mb-2"><h4 className="text-white font-bold tracking-tight text-lg">{report.title}</h4><span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 border border-white/10">{report.status}</span></div><p className="text-gray-400 text-sm leading-relaxed mb-4">{report.analysis}</p><div className="bg-black/30 p-3 rounded-lg border-l-2 border-primary"><span className="text-primary text-xs font-bold block mb-1">RECOMMENDED STRATEGY</span><p className="text-gray-300 text-xs font-mono">{report.strategy}</p></div></div>) : (<div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-2 py-4"><div className="w-12 h-1 bg-gray-800 rounded-full" /><p className="text-xs font-mono uppercase">Awaiting Command to Analyze History</p></div>)}
      </div>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState({ name: "Player", xp: 0, streak: 0 });
  const [tasks, setTasks] = useState([]);

  // --- CORE STATE ---
  const [isConfigured, setIsConfigured] = useState(false); // Has API Key?
  const [isOnboarded, setIsOnboarded] = useState(false); // Has Profile?
  const [appReady, setAppReady] = useState(false); // Loading initial state?

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

  const { playClick, playSuccess, playError, speak } = useKRYTAAudio();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    async function init() {
      try {
        // 1. Check Key Status
        const keyStatus = await api.getKeyStatus();
        setIsConfigured(keyStatus.configured);

        // 2. Check User Status (Only if key exists)
        if (keyStatus.configured) {
          const data = await api.getDashboard();
          if (data.user) {
            setUser(data.user);
            // Valid Names = Onboarded
            if (data.user.name && data.user.name !== "Operator" && data.user.name !== "Player" && data.user.name !== "AlphaUser") {
              setIsOnboarded(true);
            }
          }
          if (data.tasks) setTasks(data.tasks);
        }
      } catch (e) { console.error("Init failed", e); }
      setAppReady(true);
    }
    init();
  }, []); // Run once on mount

  // --- GREETING (Only runs once when both true) ---
  useEffect(() => {
    if (appReady && isConfigured && isOnboarded) {
      setTimeout(() => speak(`Kryta Online. Welcome back, ${user.name}.`), 1000);
    }
  }, [appReady, isConfigured, isOnboarded]);

  useEffect(() => {
    const checkReminders = setInterval(() => {
      const now = new Date();
      // Get current time in HH:mm format (24h) to match database
      const currentHM = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      tasks.forEach(t => {
        // Trigger if time matches AND task is not done
        if (t.status !== 'completed' && t.scheduled_time === currentHM) {
          // 1. Native Windows/Mac Notification
          new Notification("MISSION START", {
            body: `Objective: ${t.title}\nDuration: ${t.estimated_time}m`,
            silent: false
          });

          // 2. Audio Feedback
          playClick();
          speak(`Mission ${t.title} commencing now.`);
        }
      });
    }, 60000); // Check every 60 seconds

    return () => clearInterval(checkReminders);
  }, [tasks, speak, playClick]);

  // --- TIMER & NOTIFICATIONS ---
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timeLeft > 0) interval = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    else if (timeLeft === 0) setIsTimerRunning(false);
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handlePlan = async (e) => {
    if (e.key !== 'Enter' || !goal) return;
    playClick();
    setLoading(true);
    try {
      const res = await api.planDay(goal, 60);
      if (res.tasks) {
        setTasks(prev => [...prev, ...res.tasks]);
        setGoal("");
        showToast(`New Mission Acquired: ${res.tasks.length} Objectives`, "info");
        speak("Mission parameters logged.");
      }
    } catch (e) { showToast("KRYTA Connection Failed", "error"); playError(); }
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
        playSuccess();
        speak(`Mission Accomplished. ${res.reward.xp_gained} experience points awarded.`);
        setActiveTask(null);
      } else { showToast(`Correction Needed: ${res.verification?.reason}`, "error"); playError(); speak("Correction Needed."); }
      setProof(""); setProofImage(null);
    } catch (e) { showToast("Verification Failed", "error"); playError(); }
    setLoading(false);
  };

  // --- RENDER LOGIC (3-STAGE GATEKEEPER) ---
  if (!appReady) return <div className="h-screen w-screen bg-background flex items-center justify-center text-primary"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="h-screen w-screen bg-background text-gray-200 font-sans overflow-hidden relative selection:bg-primary/30">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {!isConfigured ? (<SetupView onComplete={() => { setIsConfigured(true); showToast("Neural Link Established", "success"); playSuccess(); }} />) :
        !isOnboarded ? (<OnboardingModal onComplete={() => { setIsOnboarded(true); showToast("Profile Created. Welcome.", "success"); playSuccess(); }} />) : (
          <>
            {/* Top HUD */}
            <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-20"><StatusCorner user={user} /></div>

            {/* Bottom HUD (Dock) */}
            <div className="absolute bottom-0 left-0 w-full p-8 flex justify-between items-end z-20 pointer-events-none">
              <div className="w-20"></div>
              <div className="flex-1 max-w-2xl mx-4 pointer-events-auto">
                <div className={`bg-surface/80 backdrop-blur-md border rounded-2xl p-1 flex items-center shadow-2xl ring-1 transition-all ${isConfigured ? "border-border ring-white/5" : "border-red-500/30 ring-red-500/20"}`}>
                  <div className={`px-4 animate-pulse ${isConfigured ? "text-primary" : "text-red-500"}`}>{isConfigured ? <Terminal size={18} /> : <AlertTriangle size={18} />}</div>
                  <input type="text" className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-600 h-12 font-medium" placeholder={loading ? "KRYTA is thinking..." : isConfigured ? "Enter mission objective..." : "SYSTEM OFFLINE"} value={goal} onChange={(e) => setGoal(e.target.value)} onKeyDown={handlePlan} disabled={loading} />
                  {loading && <Loader2 className="animate-spin text-gray-500 mr-4" size={18} />}
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
              {view === 'analytics' ? (<div className="pt-32 px-8 h-full overflow-y-auto"><AnalyticsView /></div>)
                : view === 'settings' ? (<div className="pt-32 px-8 h-full overflow-y-auto"><SettingsView showToast={showToast} setIsConfigured={setIsConfigured} playClick={playClick} /></div>)
                  : view === 'calendar' ? (<SpiralView openTask={(task) => { openTask(task); playClick(); }} />)
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

      {/* --- TOAST --- */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }} className={`absolute top-24 left-1/2 -translate-x-1/2 z-[60] px-6 py-3 rounded-xl border backdrop-blur-md shadow-[0_0_20px_rgba(0,0,0,0.5)] flex items-center gap-3 whitespace-nowrap max-w-[90vw] overflow-hidden text-ellipsis ${toast.type === 'success' ? 'bg-green-900/20 border-green-500/50 text-green-400' : toast.type === 'error' ? 'bg-red-900/20 border-red-500/50 text-red-400' : 'bg-primary/20 border-primary/50 text-primary-300'}`}>
            {toast.type === 'success' ? <Trophy size={18} /> : toast.type === 'error' ? <AlertTriangle size={18} /> : <Terminal size={18} />}
            <span className="font-mono text-sm font-bold tracking-wide uppercase truncate">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --- SYSTEM LOCKDOWN --- */}
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