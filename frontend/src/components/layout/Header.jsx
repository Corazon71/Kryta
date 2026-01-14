import { motion } from 'framer-motion';

const Header = ({ isConfigured }) => {
  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 h-16 z-50 flex items-center justify-center"
    >
      <motion.div
        className="px-8 py-3 bg-surface/60 backdrop-blur-md rounded-lg flex items-center justify-center"
        style={{
          transform: 'rotate(45deg)',
          width: '80px',
          height: '80px'
        }}
        whileHover={{
          scale: 1.05,
          transform: 'rotate(45deg) scale(1.05)'
        }}
        transition={{ type: "spring", stiffness: 400 }}
      >
        <motion.h1
          className="text-2xl font-bold text-primary tracking-wider"
          style={{
            textShadow: '0 0 15px rgba(59, 130, 246, 0.8)',
            fontFamily: '"Luxerie Display", serif',
            fontWeight: 700,
            transform: 'rotate(-45deg)',
            margin: 0,
            padding: 0,
            lineHeight: 1
          }}
          animate={{
            textShadow: isConfigured
              ? [
                '0 0 15px rgba(59, 130, 246, 0.8)',
                '0 0 25px rgba(59, 130, 246, 1)',
                '0 0 15px rgba(59, 130, 246, 0.8)'
              ]
              : [
                '0 0 15px rgba(239, 68, 68, 0.8)',
                '0 0 25px rgba(239, 68, 68, 1)',
                '0 0 15px rgba(239, 68, 68, 0.8)'
              ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          whileHover={{
            transition: { duration: 0.3 }
          }}
        >
          KRYTA
        </motion.h1>
      </motion.div>
    </motion.header>
  );
};

export default Header;
