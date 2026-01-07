import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Target } from 'lucide-react';

const globalStyles = `
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  .timeline-mask { mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent); -webkit-mask-image: linear-gradient(to right, transparent, black 15%, black 85%, transparent); }
`;

const timeToMinutes = (timeStr) => {
  if (!timeStr || timeStr.includes("Tomorrow") || timeStr === "Pending") return -1;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const getCurrentMinutes = () => {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
};

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

export default TimelineView;