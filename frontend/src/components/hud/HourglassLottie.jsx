import { useEffect, useRef, useState } from 'react';
import Lottie from 'lottie-react';
import hourglassAnimation from '../../assets/hourglass.json';

const HourglassLottie = ({ timeLeft, totalTime, isActive }) => {
  const lottieRef = useRef(null);
  const totalFrames = 204; // Total frames from the hourglass.json animation
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      if (!lottieRef.current) return;

      // Calculate progress percentage (0 = full, 1 = empty)
      const percentage = (totalTime - timeLeft) / totalTime;

      // Ensure percentage is between 0 and 1
      const clampedPercentage = Math.max(0, Math.min(1, percentage));

      // Calculate the frame to show based on percentage
      const targetFrame = Math.floor(clampedPercentage * totalFrames);

      // Go to and stop at the calculated frame
      lottieRef.current.goToAndStop(targetFrame, true);
    } catch (err) {
      console.error('Lottie animation error:', err);
      setError(err);
    }
  }, [timeLeft, totalTime]);

  if (error) {
    // Fallback display if Lottie fails
    return (
      <div className="relative w-48 h-64 flex items-center justify-center">
        <div className="text-red-500 text-center">
          <div className="text-4xl mb-2">⏳</div>
          <div className="text-xs">Animation Error</div>
        </div>
        {/* Time Display */}
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <div
            className="text-sm font-mono uppercase tracking-widest transition-colors duration-500"
            style={{
              color: timeLeft === 0 ? '#10b981' : '#7c3aed',
              textShadow: timeLeft === 0
                ? '0 0 10px rgba(16, 185, 129, 0.6)'
                : '0 0 10px rgba(124, 58, 237, 0.6)'
            }}
          >
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-48 h-64 flex items-center justify-center">
      <Lottie
        lottieRef={lottieRef}
        animationData={hourglassAnimation}
        className="w-full h-full"
        loop={false}
        autoplay={false}
        onError={(error) => {
          console.error('Lottie load error:', error);
          setError(error);
        }}
      />

      {/* Time Display */}
      <div className="absolute -bottom-8 left-0 right-0 text-center">
        <div
          className="text-sm font-mono uppercase tracking-widest transition-colors duration-500"
          style={{
            color: timeLeft === 0 ? '#10b981' : '#7c3aed',
            textShadow: timeLeft === 0
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

export default HourglassLottie;
