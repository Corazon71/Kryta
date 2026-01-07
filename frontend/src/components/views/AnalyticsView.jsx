import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Loader2, Target, Terminal } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AnalyticsView = () => {
  const [data, setData] = useState(null);
  const [report, setReport] = useState(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    api.getAnalytics().then(setData).catch(console.error);
  }, []);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const res = await api.generateReport();
      setReport(res);
    } catch (e) { alert("Analysis Failed"); }
    setGenerating(false);
  };

  if (!data) return <div className="text-gray-500 mt-20 flex items-center justify-center gap-2"><Loader2 className="animate-spin" /> Accessing Data Logs...</div>;

  const trustColor = data.stats.trust_score > 80 ? 'text-green-500' : data.stats.trust_score > 50 ? 'text-yellow-500' : 'text-red-500';

  return (
    <div className="w-full max-w-4xl mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 mx-auto">
      {/* ROW 1: METRICS */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-surface/50 border border-border p-5 rounded-2xl backdrop-blur-md col-span-1">
          <div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Success Rate</div>
          <div className="text-3xl font-bold text-white">{data.stats.completion_rate}%</div>
        </div>

        {/* HONESTY METER */}
        <div className="bg-surface/50 border border-border p-5 rounded-2xl backdrop-blur-md col-span-2 flex items-center justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-gray-500 text-xs uppercase tracking-widest mb-1 flex items-center gap-2">
              <Target size={12} /> System Trust Level
            </div>
            <div className={`text-4xl font-mono font-bold ${trustColor} tracking-tighter`}>
              {data.stats.trust_score}%
            </div>
          </div>
          <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full ${data.stats.trust_score > 80 ? 'bg-green-500' : 'bg-red-500'} transition-all duration-1000`} style={{ width: `${data.stats.trust_score}%` }} />
          </div>
          <div className={`absolute right-0 top-0 bottom-0 w-1 ${data.stats.trust_score > 80 ? 'bg-green-500' : 'bg-red-500'} opacity-20`} />
        </div>

        <div className="bg-surface/50 border border-border p-5 rounded-2xl backdrop-blur-md col-span-1">
          <div className="text-gray-500 text-xs uppercase tracking-widest mb-1">Failed</div>
          <div className="text-3xl font-bold text-red-500">{data.stats.total_failed}</div>
        </div>
      </div>

      {/* ROW 2: TACTICAL DEBRIEF */}
      <div className="bg-surface/50 border border-border p-6 rounded-3xl backdrop-blur-md mb-6 min-h-[160px]">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-gray-400 text-sm font-mono uppercase tracking-widest flex items-center gap-2">
            <Terminal size={14} /> Tactical Debrief
          </h3>
          {!report && (
            <button
              onClick={handleGenerateReport}
              disabled={generating}
              className="bg-primary/20 text-primary border border-primary/50 px-4 py-1.5 rounded-lg text-xs font-bold hover:bg-primary/30 transition-colors flex items-center gap-2"
            >
              {generating ? <Loader2 size={12} className="animate-spin" /> : "GENERATE REPORT"}
            </button>
          )}
        </div>

        {report ? (
          <div className="animate-in fade-in slide-in-from-left-2">
            <div className="flex items-center gap-3 mb-2">
              <h4 className="text-white font-bold tracking-tight text-lg">{report.title}</h4>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 border border-white/10">{report.status}</span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">{report.analysis}</p>
            <div className="bg-black/30 p-3 rounded-lg border-l-2 border-primary">
              <span className="text-primary text-xs font-bold block mb-1">RECOMMENDED STRATEGY</span>
              <p className="text-gray-300 text-xs font-mono">{report.strategy}</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-600 space-y-2 py-4">
            <div className="w-12 h-1 bg-gray-800 rounded-full" />
            <p className="text-xs font-mono uppercase">Awaiting Command to Analyze History</p>
          </div>
        )}
      </div>

      {/* ROW 3: HEATMAP GRID */}
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

      {/* ROW 4: CHART */}
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

export default AnalyticsView;