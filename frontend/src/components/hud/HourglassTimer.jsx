import React, { useState, useEffect, useRef, useMemo } from 'react';

// Utility to generate random particles
const generateParticles = (count) => {
  return Array.from({ length: count }).map((_, i) => ({
    id: i,
    delay: Math.random() * 3, // Increased delay spread for smoother stream
    duration: 1.5 + Math.random() * 1.5, // MUCH Slower (1.5s to 3s fall time)
    xOffset: (Math.random() - 0.5) * 10, // Wider scatter
    size: 1 + Math.random() * 1.5,
  }));
};

const ModernHourglass = ({
  duration = 60,
  size = 180,
  isActive = false, // External control for timer state
  onComplete // Callback when timer ends
}) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [internalActive, setInternalActive] = useState(false);
  const requestRef = useRef();
  const startTimeRef = useRef();

  const particles = useMemo(() => generateParticles(15), []);

  useEffect(() => {
    setTimeLeft(duration);
    setInternalActive(false);
    startTimeRef.current = null;
  }, [duration]);

  // Handle external control
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      handleStart();
    } else {
      handlePause();
    }
  }, [isActive]);

  // The Animation Loop
  const animate = (time) => {
    if (!startTimeRef.current) startTimeRef.current = time;
    const elapsed = (time - startTimeRef.current) / 1000;
    const newTimeLeft = Math.max(duration - elapsed, 0);

    setTimeLeft(newTimeLeft);

    if (newTimeLeft > 0) {
      requestRef.current = requestAnimationFrame(animate);
    } else {
      setInternalActive(false);
      if (onComplete) onComplete();
    }
  };

  const handleStart = () => {
    if (!internalActive && timeLeft > 0) {
      setInternalActive(true);
      const alreadyElapsed = duration - timeLeft;
      startTimeRef.current = performance.now() - (alreadyElapsed * 1000);
      requestRef.current = requestAnimationFrame(animate);
    }
  };

  const handlePause = () => {
    setInternalActive(false);
    cancelAnimationFrame(requestRef.current);
    startTimeRef.current = null;
  };

  // --- Geometry ---
  const progress = 1 - (timeLeft / duration);
  const width = 120;
  const height = 220;
  const midY = height / 2;
  const padding = 8;

  // Coordinates
  const topPoints = `${padding},${padding} ${width - padding},${padding} ${width / 2},${midY - 4}`;
  const bottomPoints = `${padding},${height - padding} ${width - padding},${height - padding} ${width / 2},${midY + 4}`;

  // Calculate sand levels
  const sandHeightBottom = (height / 2 - padding) * progress;
  const sandHeightTop = (height / 2 - padding) * (1 - progress);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 rounded-xl relative overflow-hidden">

      <style>{`
        @keyframes gentleFall {
          0% { transform: translateY(0); opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateY(${height / 2 - padding}px); opacity: 0; }
        }
        .sand-particle {
          animation-name: gentleFall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .glow-text {
          text-shadow: 0 0 10px rgba(168, 85, 247, 0.5), 0 0 20px rgba(168, 85, 247, 0.3);
        }
        .glass-panel {
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
      `}</style>

      <div className="relative z-10" style={{ width: size, height: size * 1.8 }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height="100%"
          style={{ overflow: 'visible' }}
        >
          <defs>
            {/* Gradients & Filters */}
            <linearGradient id="neonGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#d946ef" />
              <stop offset="50%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>

            <linearGradient id="glassGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="white" stopOpacity="0.05" />
              <stop offset="50%" stopColor="white" stopOpacity="0.2" />
              <stop offset="100%" stopColor="white" stopOpacity="0.05" />
            </linearGradient>

            <filter id="glow">
              <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Masks */}
            <clipPath id="topMask">
              <rect x="0" y={midY - 4 - sandHeightTop} width={width} height={sandHeightTop} />
            </clipPath>
            <clipPath id="bottomMask">
              <rect x="0" y={height - padding - sandHeightBottom} width={width} height={sandHeightBottom} />
            </clipPath>

            {/* NEW: Clip for particles to stay strictly inside bottom triangle */}
            <clipPath id="particleBounds">
              <polygon points={bottomPoints} />
            </clipPath>
          </defs>

          {/* --- GLASS SHELL --- */}
          <g className="drop-shadow-2xl">
            <polygon points={topPoints} stroke="url(#glassGradient)" strokeWidth="2" fill="rgba(255,255,255,0.02)" />
            <polygon points={bottomPoints} stroke="url(#glassGradient)" strokeWidth="2" fill="rgba(255,255,255,0.02)" />
          </g>

          {/* --- TOP SAND --- */}
          <g clipPath="url(#topMask)" filter="url(#glow)">
            <polygon points={topPoints} fill="url(#neonGradient)" />
            {/* Removed the white highlight line here */}
          </g>

          {/* --- PARTICLES --- */}
          {/* Note: applied clipPath="url(#particleBounds)" to prevent leaking */}
          {internalActive && timeLeft > 0 && (
            <g filter="url(#glow)" clipPath="url(#particleBounds)">
              {/* 
                 The group is clipped, but particles are positioned at midY. 
                 They fall downwards. The clip ensures they vanish if they hit the glass edge.
               */}
              {particles.map((p) => (
                <circle
                  key={p.id}
                  cx={(width / 2) + p.xOffset}
                  cy={midY + 4} // Start slightly inside the bottom triangle
                  r={p.size}
                  fill="#d946ef"
                  className="sand-particle"
                  style={{
                    animationDuration: `${p.duration}s`,
                    animationDelay: `-${p.delay}s`
                  }}
                />
              ))}
            </g>
          )}

          {/* --- BOTTOM SAND --- */}
          <g clipPath="url(#bottomMask)" filter="url(#glow)">
            <polygon points={bottomPoints} fill="url(#neonGradient)" />
            <circle cx={width / 2} cy={height - padding} r={width / 3} fill="white" fillOpacity="0.1" filter="blur(10px)" />
          </g>

        </svg>
      </div>

      {/* --- TIMER DISPLAY --- */}
      <div className="mt-8 flex flex-col items-center gap-6 z-10">
        <div className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-violet-500 glow-text tracking-widest font-mono">
          {Math.floor(timeLeft / 60).toString().padStart(2, '0')}:{Math.floor(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

    </div>
  );
};

export default ModernHourglass;