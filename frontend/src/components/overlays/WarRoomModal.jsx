import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Target, Clock, Play } from 'lucide-react';
import { api } from '../../api';

const WarRoomModal = ({ isOpen, onClose, goal, availableHours, onCampaignCreated }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [campaignPlan, setCampaignPlan] = useState(null);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [currentLogIndex, setCurrentLogIndex] = useState(0);
  const [error, setError] = useState(null);

  const fakeLogs = [
    ">> INITIALIZING TACTICAL COMMAND...",
    ">> SCANNING NETWORK NODES...",
    ">> RETRIEVING CURRICULUM DATABASE...",
    ">> ANALYZING TIMEFRAMES...",
    ">> CROSS-REFERENCING USER PROFILE...",
    ">> GENERATING STRATEGIC PLAN...",
    ">> OPTIMIZING MILESTONE SEQUENCE...",
    ">> FINALIZING CAMPAIGN BLUEPRINT..."
  ];

  useEffect(() => {
    if (isOpen && goal) {
      startStrategize();
    }
    return () => {
      setTerminalLogs([]);
      setCurrentLogIndex(0);
      setCampaignPlan(null);
      setError(null);
    };
  }, [isOpen, goal]);

  useEffect(() => {
    if (isLoading && currentLogIndex < fakeLogs.length) {
      const timer = setTimeout(() => {
        setTerminalLogs(prev => [...prev, fakeLogs[currentLogIndex]]);
        setCurrentLogIndex(prev => prev + 1);
      }, 800 + Math.random() * 400);
      return () => clearTimeout(timer);
    }
  }, [isLoading, currentLogIndex]);

  const startStrategize = async () => {
    setIsLoading(true);
    setTerminalLogs([]);
    setCurrentLogIndex(0);
    setError(null);

    try {
      const response = await api.strategizeCampaign(goal, availableHours);

      // Complete the remaining logs
      while (currentLogIndex < fakeLogs.length) {
        setTerminalLogs(prev => [...prev, fakeLogs[currentLogIndex]]);
        setCurrentLogIndex(prev => prev + 1);
      }

      if (response.status === 'success') {
        setCampaignPlan(response.campaign_plan);
      } else {
        setError(response.message || 'Failed to generate campaign plan');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitiateCampaign = async () => {
    if (!campaignPlan) return;

    try {
      const response = await api.confirmCampaign(campaignPlan);
      if (response.status === 'success') {
        onCampaignCreated?.(response);
        onClose();
      } else {
        setError('Failed to initiate campaign. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-50">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full h-full max-h-screen flex bg-black border border-green-500/30 shadow-[0_0_100px_rgba(0,255,0,0.1)]"
        >

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-green-500/70 hover:text-green-400 transition-colors z-10"
          >
            <X size={24} />
          </button>

          {/* Left Side - Terminal Log */}
          <div className="w-1/2 p-8 border-r border-green-500/20 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Terminal className="text-green-400" size={24} />
              <h2 className="text-2xl font-bold text-green-400 font-mono">TACTICAL TERMINAL</h2>
            </div>

            <div className="flex-1 bg-black/60 border border-green-500/20 rounded-lg p-4 font-mono text-sm overflow-hidden">
              <div className="text-green-500 mb-4">SYSTEM: Campaign Strategizer v2.0</div>
              <div className="text-green-400 mb-2">TARGET: {goal}</div>
              <div className="text-yellow-400 mb-4">AVAILABILITY: {availableHours}h/day</div>

              <div className="space-y-1">
                {terminalLogs.map((log, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-green-300 typewriter matrix-glow"
                  >
                    {log}
                  </motion.div>
                ))}
                {isLoading && (
                  <motion.div
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="text-green-300"
                  >
                    ▊
                  </motion.div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4 bg-red-500/10 border border-red-500/50 p-3 rounded-lg text-red-400 text-sm">
                ERROR: {error}
              </div>
            )}
          </div>

          {/* Right Side - Result Panel */}
          <div className="w-1/2 p-8 flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <Target className="text-yellow-400" size={24} />
              <h2 className="text-2xl font-bold text-yellow-400 font-mono">CAMPAIGN BLUEPRINT</h2>
            </div>

            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 border-4 border-green-500/30 border-t-green-400 rounded-full animate-spin mb-4"></div>
                  <div className="text-green-400 font-mono">ANALYZING...</div>
                </div>
              </div>
            ) : campaignPlan ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="flex-1 space-y-6"
              >
                {/* Campaign Title */}
                <div className="bg-black/40 border border-yellow-500/20 rounded-lg p-4">
                  <div className="text-yellow-400 text-sm font-mono mb-2">CAMPAIGN DESIGNATION</div>
                  <div className="text-white text-xl font-bold gold-glow">{campaignPlan.campaign_title}</div>
                </div>

                {/* Milestones Tree */}
                <div className="bg-black/40 border border-green-500/20 rounded-lg p-4">
                  <div className="text-green-400 text-sm font-mono mb-4">MILESTONE SEQUENCE</div>
                  <div className="space-y-3">
                    {campaignPlan.milestones?.map((milestone, index) => (
                      <div key={index} className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-green-500/20 border border-green-500/50 rounded-full flex items-center justify-center text-green-400 text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-semibold">{milestone.title}</div>
                          <div className="text-gray-400 text-sm mb-2">{milestone.description}</div>
                          <div className="text-green-300 text-xs font-mono">
                            Week {milestone.week_number} • {milestone.suggested_tasks?.length || 0} objectives
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Schedule */}
                <div className="bg-black/40 border border-blue-500/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="text-blue-400" size={16} />
                    <div className="text-blue-400 text-sm font-mono">RECURRING SCHEDULE</div>
                  </div>
                  <div className="text-white font-mono">{campaignPlan.recurrence_schedule}</div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg font-bold hover:bg-red-500/30 transition-all"
                  >
                    ABORT
                  </button>
                  <button
                    onClick={handleInitiateCampaign}
                    className="flex-1 py-3 bg-green-500/20 border border-green-500/50 text-green-400 rounded-lg font-bold hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
                  >
                    <Play size={16} />
                    INITIATE CAMPAIGN
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <Target size={48} className="mx-auto mb-4 opacity-50" />
                  <div className="font-mono">AWAITING STRATEGY DATA...</div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WarRoomModal;
