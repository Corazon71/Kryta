import { useState, useEffect } from 'react';
import { api } from '../../api';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

const SpiralView = ({ openTask, playClick }) => {
  const [tasks, setTasks] = useState([]);
  const [hoveredTask, setHoveredTask] = useState(null);
  const [maxDays, setMaxDays] = useState(7);

  useEffect(() => {
    api.getCalendar().then(setTasks).catch(console.error);
  }, []);

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
    return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  };

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
    <div onWheel={handleScroll} className="w-full h-full flex flex-col items-center justify-center relative pb-20 overflow-hidden cursor-ns-resize">
      {/* 1. TOP-RIGHT: TASK DETAIL */}
      <AnimatePresence>
        {hoveredTask && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="absolute top-12 right-8 z-50 bg-surface/90 border border-primary/50 p-6 rounded-2xl shadow-[0_0_50px_rgba(124,58,237,0.3)] max-w-sm backdrop-blur-xl pointer-events-none">
            <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2 justify-end">
              <span className="text-gray-400 font-mono text-xs mr-auto">{hoveredTask.scheduled_time}</span>
              <span className="text-primary font-mono text-xs font-bold tracking-widest">{hoveredTask.target_date}</span>
              <div className={`w-2 h-2 rounded-full ${hoveredTask.is_urgent ? 'bg-red-500' : 'bg-primary'} animate-pulse`}></div>
            </div>
            <h2 className="text-2xl font-bold text-white leading-tight mb-2 text-right">{hoveredTask.title}</h2>
            <div className="flex gap-4 text-xs font-mono text-gray-500 uppercase justify-end"><span>PRIORITY: {hoveredTask.priority.toUpperCase()}</span><span>EST: {hoveredTask.estimated_time} MIN</span></div>
            <div className="mt-4 text-right"><div className="text-[10px] text-primary/70 border border-primary/20 rounded px-2 py-1 inline-block">CLICK TO INITIALIZE</div></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. BOTTOM-LEFT: HUD */}
      <div className="absolute bottom-12 left-8 border-l-2 border-primary pl-4 pointer-events-none z-10 transition-all text-left">
        <h3 className="font-bold text-white text-2xl tracking-tighter">TEMPORAL RADAR</h3>
        <p className="text-primary font-mono text-xs uppercase tracking-widest mt-1">SCAN RANGE: {maxDays} DAYS</p>
        <p className="text-gray-500 font-mono text-[9px] mt-1 opacity-50 uppercase tracking-tighter">SCROLL TO EXPAND RANGE</p>
        <div className="mt-2 flex items-center justify-start gap-2 text-[10px] text-gray-500 font-mono"><span className="w-2 h-2 rounded-full bg-primary"></span> ROUTINE <span className="w-2 h-2 rounded-full bg-red-500 ml-2"></span> URGENT</div>
      </div>

      {/* 3. RADAR */}
      <div className="relative group scale-90 lg:scale-100 transition-transform">
        <div className="absolute inset-0 rounded-full border border-primary/5 animate-[spin_10s_linear_infinite] pointer-events-none" style={{ maskImage: 'conic-gradient(from 0deg, transparent 0deg, black 360deg)' }} />
        <svg width={size} height={size} className="overflow-visible">
          <defs><radialGradient id="radar-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0%" stopColor="#7c3aed" stopOpacity="0.2" /><stop offset="100%" stopColor="transparent" stopOpacity="0" /></radialGradient></defs>
          <circle cx={center} cy={center} r={innerRadius + (maxDays * dayGap)} fill="url(#radar-glow)" />

          {/* Rings */}
          {[...Array(maxDays)].map((_, i) => {
            const r = innerRadius + (i * dayGap);
            const showLabel = maxDays <= 10 || i % 5 === 0 || i === maxDays - 1;
            return (<g key={`ring-${i}`}><circle cx={center} cy={center} r={r} fill="none" stroke={i === 0 ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.05)"} strokeWidth="1" strokeDasharray={i === 0 ? "0" : "4 4"} />{showLabel && (<text x={center} y={center - r - 5} textAnchor="middle" fill={i === 0 ? "#7c3aed" : "#4b5563"} fontSize="9" fontFamily="monospace" fontWeight="bold">{getDateLabel(i)}</text>)}</g>);
          })}

          {/* Spokes */}
          {[{ deg: 0, label: "12 PM" }, { deg: 90, label: "6 PM" }, { deg: 180, label: "12 AM" }, { deg: 270, label: "6 AM" }].map((spoke, i) => {
            const rMax = innerRadius + (maxDays * dayGap);
            const angleRad = (spoke.deg - 90) * Math.PI / 180;
            return (<g key={`spoke-${i}`}><line x1={center} y1={center} x2={center + rMax * Math.cos(angleRad)} y2={center + rMax * Math.sin(angleRad)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" /><text x={center + (rMax + 20) * Math.cos(angleRad)} y={center + (rMax + 20) * Math.sin(angleRad) + 5} textAnchor="middle" fill="#9ca3af" fontSize="10" fontFamily="monospace" fontWeight="bold">{spoke.label}</text></g>);
          })}

          {/* Tasks */}
          {tasks.map((task) => {
            const mins = timeToMinutes(task.scheduled_time);
            if (mins === -1) return null;
            const today = new Date(); today.setHours(0, 0, 0, 0);
            const target = new Date(task.target_date); target.setHours(0, 0, 0, 0);
            const diffTime = target - today;
            const dayIndex = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (dayIndex < 0 || dayIndex >= maxDays) return null;
            const solarMins = (mins + 720) % 1440;
            const startAngle = (solarMins / 1440) * 360;
            const durationDegrees = Math.max((task.estimated_time / 1440) * 360, 2);
            const endAngle = startAngle + durationDegrees;
            const radius = innerRadius + (dayIndex * dayGap);
            let color = "#7c3aed"; if (task.is_urgent) color = "#ef4444"; if (task.priority === 'high') color = "#f59e0b";
            const isHovered = hoveredTask && hoveredTask.id === task.id;
            return (
              <g key={task.id} onClick={() => { playClick(); openTask(task); }} onMouseEnter={() => { playClick(); setHoveredTask(task); }} onMouseLeave={() => setHoveredTask(null)} className="cursor-pointer">
                <path d={describeArc(center, center, radius, startAngle, endAngle)} fill="none" stroke={isHovered ? "#ffffff" : color} strokeWidth={isHovered ? "6" : "3"} strokeLinecap="round" className="transition-all duration-200 drop-shadow-[0_0_8px_rgba(0,0,0,0.8)]" />
                <path d={describeArc(center, center, radius, startAngle, endAngle)} fill="none" stroke="transparent" strokeWidth="20" />
              </g>
            );
          })}
          <circle cx={center} cy={center} r="5" fill="#fff" className="animate-pulse" />
        </svg>
      </div>
    </div>
  );
};

export default SpiralView;