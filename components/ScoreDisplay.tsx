import React, { useEffect, useState, useRef } from 'react';
import { ScoreResult } from '../types';
import { getGradeColor } from '../utils/scoring';

interface ScoreDisplayProps {
  result: ScoreResult;
  isLive?: boolean;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ result, isLive = false }) => {
  const [displayScore, setDisplayScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const prevScoreRef = useRef(0);

  useEffect(() => {
    if (isLive) {
      // While drawing: Show score instantly
      setDisplayScore(result.score);
      prevScoreRef.current = result.score;
      setIsFinished(false);
    } else {
      // Finished: Animate from Last Live Score -> Final Score
      let animationFrameId: number;
      let startTimestamp: number | null = null;
      const duration = 600; // 0.6 seconds animation
      
      const startValue = prevScoreRef.current;
      const endValue = result.score;

      const step = (timestamp: number) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // Cubic ease out
        const current = startValue + (endValue - startValue) * ease;
        
        setDisplayScore(current);

        if (progress < 1) {
          animationFrameId = window.requestAnimationFrame(step);
        } else {
          setDisplayScore(endValue);
          setIsFinished(true);
          prevScoreRef.current = endValue;
        }
      };

      animationFrameId = window.requestAnimationFrame(step);
      return () => cancelAnimationFrame(animationFrameId);
    }
  }, [result.score, isLive]);

  const color = isLive ? '#00FFFF' : getGradeColor(result.grade);
  const glowStyle = { textShadow: `0 0 10px ${color}, 0 0 20px ${color}` };

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-20">
      <div 
        className={`text-6xl md:text-8xl font-mono font-bold tracking-tighter transition-transform duration-300 ${isFinished ? 'scale-125' : 'scale-100'}`}
        style={{ color: color, ...glowStyle }}
      >
        {displayScore.toFixed(1)}%
      </div>
      <div 
        className="mt-4 text-xl md:text-2xl font-mono tracking-widest uppercase opacity-80"
        style={{ color: color }}
      >
        {isLive ? "ANALYZING..." : result.grade}
      </div>
    </div>
  );
};

export default ScoreDisplay;