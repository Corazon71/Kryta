import { Check, Circle } from 'lucide-react';

const MissionStepper = ({ currentTask, allTasks }) => {
  const groupId = currentTask?.group_id;
  if (!groupId || !Array.isArray(allTasks)) return null;

  const chainTasks = allTasks
    .filter(t => t?.group_id === groupId)
    .sort((a, b) => {
      const aOrder = Number.isFinite(Number(a?.step_order)) ? Number(a.step_order) : 1;
      const bOrder = Number.isFinite(Number(b?.step_order)) ? Number(b.step_order) : 1;
      return aOrder - bOrder;
    });

  if (chainTasks.length <= 1) return null;

  return (
    <div className="mt-4">
      <div className="text-[10px] uppercase tracking-widest text-gray-400 mb-2" style={{
        fontFamily: '"JetBrains Mono", monospace',
        fontWeight: 700
      }}>
        Mission Chain
      </div>

      <div className="flex flex-col gap-2">
        {chainTasks.map((t) => {
          const isCompleted = t?.status === 'completed';
          const isCurrent = t?.id === currentTask?.id;

          let icon = <Circle size={14} className="text-white/30" />;
          let textClass = "text-white/60";
          let rowClass = "";

          if (isCompleted) {
            icon = <Check size={14} className="text-emerald-400" />;
            textClass = "text-white/50 line-through";
          } else if (isCurrent) {
            icon = <Circle size={14} className="text-primary" />;
            textClass = "text-white";
            rowClass = "shadow-[0_0_20px_rgba(124,58,237,0.35)]";
          }

          return (
            <div key={t.id} className={`flex items-start gap-3 rounded-lg px-2 py-1 ${rowClass}`}>
              <div className="mt-0.5 w-5 flex items-center justify-center">
                {icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm ${textClass}`}>{t.title}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MissionStepper;
