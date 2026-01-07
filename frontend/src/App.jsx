import { useState, useEffect } from 'react';
import { api } from './api';
import { motion } from 'framer-motion';
import { Terminal, LayoutGrid, BarChart3, Settings, AlertTriangle, Calendar, Loader2 } from 'lucide-react';
import { useKRYTAAudio } from './hooks/useKRYTAAudio';

// Views
import AnalyticsView from './components/views/AnalyticsView';
import SpiralView from './components/views/SpiralView';
import TimelineView from './components/views/TimelineView';
import SettingsView from './components/views/SettingsView';

// Components
import StatusCorner from './components/hud/StatusCorner';
import Toast from './components/hud/Toast';
import SetupView from './components/overlays/SetupView';
import OnboardingModal from './components/overlays/OnboardingModal';
import TaskModal from './components/overlays/TaskModal';
import SystemLockdown from './components/overlays/SystemLockdown';

function App() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState({ name: "Player", xp: 0, streak: 0 });
  const [tasks, setTasks] = useState([]); // Stores ALL tasks (future & present)

  // App State
  const [isConfigured, setIsConfigured] = useState(false);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [appReady, setAppReady] = useState(false);
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTask, setActiveTask] = useState(null);
  const [toast, setToast] = useState(null);

  // Lockdown
  const [isLocked, setIsLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState("");

  const { playClick, playSuccess, playError, speak } = useKRYTAAudio();

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

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
    if (appReady && isOnboarded && isConfigured) setTimeout(() => speak(`KRYTA Online. Welcome back, ${user.name}.`), 1000);
  }, [appReady, isConfigured, isOnboarded]);

  // --- NOTIFICATION LOOP ---
  useEffect(() => {
    const checkReminders = setInterval(() => {
      const now = new Date();
      const currentHM = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });

      // BUG FIX: Ensure we only notify for TODAY'S tasks
      const todayStr = new Date().toISOString().split('T')[0];

      tasks.forEach(t => {
        if (t.target_date === todayStr && t.status !== 'completed' && t.scheduled_time === currentHM) {
          new Notification("MISSION START", { body: `Objective: ${t.title}`, silent: false });
          playClick(); speak(`Mission ${t.title} commencing now.`);
        }
      });
    }, 60000);
    return () => clearInterval(checkReminders);
  }, [tasks]);

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
    } catch (e) { showToast("Network Link Failed", "error"); playError(); }
    setLoading(false);
  };

  const handleVerify = async (taskId, proof, proofImage) => {
    setLoading(true);
    try {
      const res = await api.verifyTask(taskId, proof, proofImage);
      if (res.status === 'locked') { setIsLocked(true); setLockMessage(res.verification?.reason || res.message); setActiveTask(null); playError(); setLoading(false); return; }

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: res.task_status } : t));

      if (res.task_status === 'completed' && res.reward) {
        setUser(prev => ({ ...prev, xp: res.reward.total_user_xp, streak: res.reward.current_streak }));
        showToast(`Mission Passed: +${res.reward.xp_gained} XP`, "success");
        playSuccess();
        speak(`Mission Accomplished.`);
        setActiveTask(null);
      } else { showToast(`Correction Needed: ${res.verification?.reason}`, "error"); playError(); speak("Correction Needed."); }
    } catch (e) { showToast("Verification Failed", "error"); playError(); }
    setLoading(false);
  };

  const openTask = (task) => {
    setActiveTask(task);
    playClick();
  };

  // --- BUG FIX: FILTER TASKS FOR TIMELINE ---
  // Only pass TODAY'S tasks to the timeline view
  const todaysTasks = tasks.filter(t => {
    // Handle simple string comparison or Date object conversion
    const tDate = new Date(t.target_date).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return tDate === today;
  });

  if (!appReady) return <div className="h-screen w-screen bg-background flex items-center justify-center text-primary"><Loader2 className="animate-spin w-8 h-8" /></div>;

  return (
    <div className="h-screen w-screen bg-background text-gray-200 font-sans overflow-hidden relative selection:bg-primary/30">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      {!isConfigured ? (<SetupView onComplete={() => { setIsConfigured(true); showToast("Neural Link Established", "success"); playSuccess(); }} showToast={showToast} playSuccess={playSuccess} />) :
        !isOnboarded ? (<OnboardingModal onComplete={() => { setIsOnboarded(true); showToast("Profile Created. Welcome.", "success"); playSuccess(); }} showToast={showToast} playSuccess={playSuccess} />) : (
          <>
            <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start z-20"><StatusCorner user={user} /></div>

            {/* Dock */}
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
                  : view === 'calendar' ? (<SpiralView openTask={(task) => { openTask(task); }} playClick={playClick} />)
                    : (
                      <>
                        {todaysTasks.length === 0 && !loading ? (
                          <div className="flex flex-col items-center justify-center h-full pb-20">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                              <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">{isConfigured ? "KRYTA ONLINE." : <span className="text-gray-500">SYSTEM OFFLINE.</span>}</h1>
                              <p className="text-gray-500 text-lg max-w-md mx-auto">{isConfigured ? "Awaiting mission parameters." : "Configuration required."}</p>
                            </motion.div>
                          </div>
                        ) : (
                          <TimelineView tasks={todaysTasks} openTask={openTask} playClick={playClick} />
                        )}
                      </>
                    )}
            </div>

            {/* Modals */}
            {activeTask && <TaskModal activeTask={activeTask} onClose={() => setActiveTask(null)} onVerify={handleVerify} playClick={playClick} loading={loading} />}
          </>
        )}

      <Toast toast={toast} />
      <SystemLockdown isLocked={isLocked} lockMessage={lockMessage} onUnlock={() => setIsLocked(false)} />
    </div>
  );
}

export default App;