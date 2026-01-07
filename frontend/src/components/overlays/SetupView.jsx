import { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal, Loader2 } from 'lucide-react';
import { api } from '../../api';

const SetupView = ({ onComplete, showToast, playSuccess }) => {
    const [key, setKey] = useState("");
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState("");

    const handleVerify = async () => {
        setVerifying(true); setError("");
        try {
            const res = await api.saveKey(key);
            if (res.status === 'success') {
                showToast("Neural Link Established", "success");
                playSuccess();
                onComplete();
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
                        {verifying ? <Loader2 className="animate-spin mx-auto"/> : "INITIALIZE SYSTEM"}
                    </button>
                </div>
                <div className="mt-8 text-xs text-gray-700 font-mono">KRYTA v3.0 // SECURITY CHECKPOINT</div>
            </motion.div>
        </div>
    );
};
export default SetupView;