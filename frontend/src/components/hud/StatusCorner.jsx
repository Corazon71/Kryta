import { Terminal } from 'lucide-react';

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
export default StatusCorner;