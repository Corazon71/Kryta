import { useState, useEffect } from 'react';
import { api } from '../../api';
import { Settings, Loader2, CheckCircle, Terminal } from 'lucide-react';

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
export default SettingsView;