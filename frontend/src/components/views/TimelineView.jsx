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
      <div className="mb-6 w-full max-w-xl px-6 h-40 flex items-end justify-center z-20 relative">
        <AnimatePresence mode="wait">
          {displayTask ? (
            <motion.div
              key={displayTask.id}
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
              onClick={() => { playClick(); openTask(displayTask); }}
              className={`w-full backdrop-blur-xl border p-6 rounded-3xl cursor-pointer group relative overflow-hidden transition-colors ${displayTask.id === selectedTaskId ? 'bg-surface/95 border-primary' : 'bg-surface/95 border-primary/50'
                }`}
            >
              <div className="relative z-10 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 text-primary text-[10px] uppercase tracking-widest mb-1" style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 700
                  }}>
                    {displayTask === timeActiveTask && (
                      <motion.span
                        className="relative flex h-2 w-2"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.8, 1, 0.8],
                          boxShadow: [
                            '0 0 5px rgba(59, 130, 246, 0.8)',
                            '0 0 15px rgba(59, 130, 246, 1)',
                            '0 0 5px rgba(59, 130, 246, 0.8)'
                          ]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      >
                        <span className="absolute h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
                        <span className="relative rounded-full h-2 w-2 bg-primary" />
                      </motion.span>
                    )}
                    {displayTask === timeActiveTask ? "Current Mission" : "Scheduled Mission"}
                  </div>
                  <h2 className="text-2xl font-bold text-white tracking-tight" style={{
                    textShadow: '0 0 15px rgba(255, 255, 255, 0.8), 0 0 30px rgba(59, 130, 246, 0.6)',
                    fontFamily: '"Inter", sans-serif',
                    fontWeight: 500
                  }}>{displayTask.title}</h2>
                  {displayTask.proof_instruction && (
                    <div className="flex items-start gap-2 text-xs text-blue-300 bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg mt-2 w-fit">
                      <Target size={14} className="mt-0.5 shrink-0" />
                      <span className="font-mono" style={{
                        fontFamily: '"Inter", sans-serif',
                        fontWeight: 400
                      }}>{displayTask.proof_instruction}</span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl text-white font-bold" style={{
                    textShadow: '0 0 15px rgba(255, 255, 255, 0.8), 0 0 25px rgba(59, 130, 246, 0.6)',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 700
                  }}>{displayTask.scheduled_time}</div>
                  <div className="text-[10px] text-gray-200 tracking-widest" style={{
                    textShadow: '0 0 10px rgba(255, 255, 255, 0.6)',
                    fontFamily: '"JetBrains Mono", monospace',
                    fontWeight: 400
                  }}>{displayTask.estimated_time} MIN</div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pb-4 relative z-10">
              <h2 className="text-2xl font-bold text-white tracking-tight" style={{
                textShadow: '0 0 25px rgba(255, 255, 255, 0.9), 0 0 50px rgba(59, 130, 246, 0.7)',
                fontFamily: '"Inter", sans-serif',
                fontWeight: 500
              }}>TIMELINE CLEAR</h2>
              <p className="text-gray-200 text-[10px] uppercase tracking-widest mt-1" style={{
                textShadow: '0 0 15px rgba(255, 255, 255, 0.7)',
                fontFamily: '"JetBrains Mono", monospace',
                fontWeight: 400
              }}>Standby Mode // Monitoring</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Timeline Strip */}
      <div ref={scrollRef} className="w-full overflow-x-auto scrollbar-hide relative h-32 select-none timeline-mask">
        <div className="relative h-full min-w-[5760px] flex items-center">
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/20 w-full" />
          {[...Array(25)].map((_, i) => (<div key={i} className="absolute top-1/2" style={{ left: `${i * 60 * pxPerMin}px` }}><div className="w-1.5 h-1.5 bg-gray-400 rounded-full -mt-[3px] -ml-[3px]" /><div className="absolute top-4 -left-3 text-[10px] text-gray-400 font-bold" style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontWeight: 700
          }}>{i.toString().padStart(2, '0')}:00</div></div>))}
          {tasks.map(task => {
            const start = timeToMinutes(task.scheduled_time);
            if (start === -1 || task.status === 'completed') return null;
            const width = Math.max(task.estimated_time * pxPerMin, 20);
            const isShort = task.estimated_time < 30;
            const isPast = start + task.estimated_time < nowMinutes;
            const isActive = task === timeActiveTask;
            const isHovered = task.id === hoveredTaskId || task.id === selectedTaskId;

            let colorClass = "border-blue-500";
            let glowColor = "shadow-[0_0_8px_#3b82f6]";
            let nodeColor = "bg-blue-500";
            let lineColor = "bg-blue-500";

            if (task.is_urgent) {
              colorClass = "border-red-500";
              glowColor = "shadow-[0_0_8px_#ef4444]";
              nodeColor = "bg-red-500";
              lineColor = "bg-red-500";
            }
            else if (task.priority === 'high') {
              colorClass = "border-amber-500";
              glowColor = "shadow-[0_0_8px_#f59e0b]";
              nodeColor = "bg-amber-500";
              lineColor = "bg-amber-500";
            }

            if (isPast) {
              nodeColor = "bg-gray-400";
              lineColor = "bg-gray-400";
            }

            return (
              <div key={task.id} className="absolute top-[35%] h-4 cursor-pointer z-10" style={{ left: `${start * pxPerMin}px`, width: `${width}px` }}>
                <div
                  onClick={(e) => { e.stopPropagation(); playClick(); setSelectedTaskId(task.id); }}
                  onMouseEnter={() => setHoveredTaskId(task.id)}
                  onMouseLeave={() => setHoveredTaskId(null)}
                  className={`relative w-full h-full ${isPast ? 'opacity-30 grayscale' : ''}`}
                >
                  {/* Circuit Trace Container */}
                  <div className="relative w-full h-full flex items-center">
                    {/* Start Node */}
                    <div
                      className={`absolute left-0 w-3 h-3 rotate-45 transition-all duration-200 ${isHovered || isActive ? 'ring-2 ring-offset-1 ring-offset-transparent' : ''
                        } ${nodeColor} ${isHovered || isActive ? 'opacity-100' : 'opacity-50'}`}
                      style={{
                        boxShadow: (isHovered || isActive) ? `0 0 12px ${nodeColor.includes('red') ? '#ef4444' : nodeColor.includes('amber') ? '#f59e0b' : '#3b82f6'}` : 'none'
                      }}
                    />

                    {/* Duration Trace Line */}
                    <div
                      className={`absolute left-1.5 right-1 h-[2px] transition-all duration-200 ${lineColor} ${isHovered || isActive ? 'opacity-100' : 'opacity-50'
                        } ${glowColor}`}
                      style={{
                        boxShadow: (isHovered || isActive) ? `0 0 8px ${lineColor.includes('red') ? '#ef4444' : lineColor.includes('amber') ? '#f59e0b' : '#3b82f6'}` : 'none'
                      }}
                    />

                    {/* End Terminal */}
                    <div
                      className={`absolute right-0 w-0.5 h-3 transition-all duration-200 ${lineColor} ${isHovered || isActive ? 'opacity-100' : 'opacity-50'
                        }`}
                    />
                  </div>
                </div>
              </div>
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