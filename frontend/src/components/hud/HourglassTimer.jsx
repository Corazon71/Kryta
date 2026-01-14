import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

const HourglassTimer = ({ timeLeft, totalTime, isActive }) => {
  const progress = timeLeft / totalTime;
  const isComplete = timeLeft === 0;

  return (
    <div className="relative w-48 h-64 flex items-center justify-center">
      {/* SVG Container */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 192 256"
      >
        {/* Define clip paths for triangular chambers */}
        <defs>
          <clipPath id="topClip">
            <path d="M 96 32 L 32 96 L 32 128 L 96 192 L 160 128 L 160 96 Z" />
          </clipPath>
          <clipPath id="bottomClip">
            <path d="M 96 192 L 32 128 L 32 96 L 96 32 L 160 96 L 160 128 Z" />
          </clipPath>
        </defs>

        {/* Glass Outline */}
        <path
          d="M 96 32 L 32 96 L 32 128 L 96 192 L 160 128 L 160 96 Z"
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="2"
        />

        {/* Top and Bottom Rings */}
        <ellipse cx="96" cy="32" rx="64" ry="8" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" />
        <ellipse cx="96" cy="192" rx="64" ry="8" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2" />

        {/* Top Chamber Fill */}
        <motion.g clipPath="url(#topClip)">
          <motion.path
            d="M 96 32 L 32 96 L 32 128 L 96 192 L 160 128 L 160 96 Z"
            fill={isComplete ? "#10b981" : "#7c3aed"}
            initial={{ opacity: 1 }}
            animate={{
              y: (1 - progress) * 160,
              opacity: progress > 0 ? 1 : 0
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 10px rgba(124, 58, 237, 0.5))' }}
          />
        </motion.g>

        {/* Bottom Chamber Fill */}
        <motion.g clipPath="url(#bottomClip)">
          <motion.path
            d="M 96 192 L 32 128 L 32 96 L 96 32 L 160 96 L 160 128 Z"
            fill={isComplete ? "#10b981" : "#7c3aed"}
            initial={{ opacity: 0 }}
            animate={{
              y: -(1 - progress) * 160,
              opacity: (1 - progress) > 0 ? 1 : 0
            }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{ filter: 'drop-shadow(0 0 10px rgba(124, 58, 237, 0.5))' }}
          />
        </motion.g>

        {/* Data Stream - Only visible when active */}
        <AnimatePresence>
          {isActive && timeLeft > 0 && (
            <motion.line
              x1="96" y1="112" x2="96" y2="112"
              stroke={isComplete ? "#10b981" : "#7c3aed"}
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              exit={{ pathLength: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                pathLength: 1,
                strokeDasharray: "1 20",
                filter: 'drop-shadow(0 0 8px rgba(124, 58, 237, 0.8))'
              }}
            />
          )}
        </AnimatePresence>

        {/* Subtle Particle Effects */}
        {isActive && timeLeft > 0 && [...Array(6)].map((_, i) => (
          <motion.circle
            key={i}
            cx={96}
            cy={112}
            r="1"
            fill="rgba(255, 255, 255, 0.6)"
            initial={{ y: -20 }}
            animate={{ y: 20 }}
            transition={{
              duration: 2,
              delay: i * 0.3,
              repeat: Infinity,
              ease: 'linear'
            }}
          />
        ))}
      </svg>

      {/* Time Display */}
      <div className="absolute -bottom-8 left-0 right-0 text-center">
        <div
          className="text-sm font-mono uppercase tracking-widest transition-colors duration-500"
          style={{
            color: isComplete ? '#10b981' : '#7c3aed',
            textShadow: isComplete
              ? '0 0 10px rgba(16, 185, 129, 0.6)'
              : '0 0 10px rgba(124, 58, 237, 0.6)'
          }}
        >
          {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>
    </div>
  );
};

export default HourglassTimer;
