import { motion } from 'framer-motion';

const WelcomeMessage = ({ isConfigured }) => {
  const message = isConfigured ? "KRYTA ONLINE." : "SYSTEM OFFLINE.";
  const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';

  const typewriterVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.5
      }
    }
  };

  const charVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      rotate: 0
    },
    visible: {
      opacity: 1,
      y: 0,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 200
      }
    },
    glitch: {
      rotate: [-5, 5, -3, 3, 0],
      transition: {
        duration: 0.3,
        repeat: 2,
        repeatType: "reverse"
      }
    }
  };

  const renderDecodingText = (text) => {
    return text.split('').map((char, index) => (
      <motion.span
        key={index}
        variants={charVariants}
        initial="hidden"
        animate="visible"
        whileHover="glitch"
        style={{
          display: 'inline-block',
          fontFamily: '"Inter", sans-serif',
          fontWeight: 500
        }}
      >
        {char}
      </motion.span>
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1, delay: 0.5 }}
      className="text-center"
    >
      <motion.h1
        variants={typewriterVariants}
        initial="hidden"
        animate="visible"
        className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-6"
        style={{
          fontFamily: '"Courier New", monospace',
          background: isConfigured
            ? 'linear-gradient(45deg, #10b981, #60a5fa, #10b981)'
            : 'linear-gradient(45deg, #ef4444, #f87171, #ef4444)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          filter: `drop-shadow(0 0 20px ${isConfigured ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'})`,
          animation: 'glow 3s ease-in-out infinite'
        }}
      >
        {renderDecodingText(message)}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
        className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
        style={{
          fontFamily: '"Inter", sans-serif',
          fontWeight: 400
        }}
      >
        {isConfigured
          ? "Awaiting mission parameters. Neural link established."
          : "Configuration required. System offline."
        }
      </motion.p>

      {/* Animated status indicator */}
      <motion.div
        className="mt-8 flex justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 2, type: "spring" }}
      >
        <motion.div
          className="w-4 h-4 rounded-full"
          style={{
            backgroundColor: isConfigured ? '#10b981' : '#ef4444',
            boxShadow: `0 0 20px ${isConfigured ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)'}`
          }}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      <style jsx>{`
        @keyframes glow {
          0%, 100% { 
            filter: drop-shadow(0 0 20px ${isConfigured ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'});
          }
          50% { 
            filter: drop-shadow(0 0 30px ${isConfigured ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)'});
          }
        }
      `}</style>
    </motion.div>
  );
};

export default WelcomeMessage;
