import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { api } from '../../api';

const OnboardingModal = ({ onComplete, showToast, playSuccess }) => {
  const [formData, setFormData] = useState({ name: "", work_hours: "", bad_habits: "", core_goals: "" });
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.onboardUser(formData);
      setTimeout(() => {
        showToast("Profile Created. Welcome.", "success");
        playSuccess();
        onComplete();
      }, 1000);
    } catch (e) { alert("Error"); setSubmitting(false); }
  };

  const steps = [
    { label: "IDENTITY", field: "name", question: "Enter Player Name.", placeholder: "e.g. Ash" },
    { label: "RESTRICTED ZONES", field: "work_hours", question: "When are you busy? (Work/School)", placeholder: "e.g. Mon-Fri 9am-5pm" },
    { label: "MAINTENANCE", field: "bad_habits", question: "When do you Sleep and Eat?", placeholder: "e.g. Sleep 11pm-7am, Lunch 1pm" },
    { label: "MAIN QUEST", field: "core_goals", question: "What is your main goal for 2025?", placeholder: "e.g. Get Fit, Learn Coding" }
  ];

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center p-8 backdrop-blur-xl bg-black/80">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="w-full max-w-xl bg-surface border border-primary/30 p-12 relative shadow-[0_0_100px_rgba(124,58,237,0.2)]">
        {/* Decor Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-primary"></div><div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-primary"></div><div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-primary"></div><div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-primary"></div>

        {submitting ? <div className="text-center py-10"><Loader2 className="animate-spin w-12 h-12 text-primary mx-auto mb-4" /><h2 className="text-xl font-mono text-white animate-pulse">CREATING PROFILE...</h2></div> : (<><div className="mb-8"><span className="text-primary font-mono text-xs uppercase block mb-2">Initialization {step + 1}/{steps.length}</span><h1 className="text-3xl font-bold text-white">{steps[step].question}</h1></div><input autoFocus type="text" className="w-full bg-transparent border-b-2 border-gray-700 text-2xl py-2 text-white outline-none focus:border-primary font-mono" placeholder={steps[step].placeholder} value={formData[steps[step].field]} onChange={(e) => setFormData({ ...formData, [steps[step].field]: e.target.value })} onKeyDown={(e) => { if (e.key === 'Enter' && formData[steps[step].field]) { step < steps.length - 1 ? setStep(step + 1) : handleSubmit() } }} /><button onClick={() => { step < steps.length - 1 ? setStep(step + 1) : handleSubmit() }} disabled={!formData[steps[step].field]} className="mt-8 bg-white text-black font-bold py-2 px-6 font-mono uppercase disabled:opacity-50">Next &gt;&gt;</button></>)}
      </motion.div>
    </div>
  );
};
export default OnboardingModal;