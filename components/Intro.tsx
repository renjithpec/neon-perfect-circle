import React, { useEffect, useState, useRef } from 'react';

interface IntroProps {
  onComplete: () => void;
}

const Intro: React.FC<IntroProps> = ({ onComplete }) => {
  const [started, setStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Setup Audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/intro.mp3');
    audioRef.current.volume = 0.6;
  }, []);

  // Timer Logic
  useEffect(() => {
    let interval: number;
    if (started && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (started && timeLeft === 0) {
      onComplete();
    }
    return () => clearInterval(interval);
  }, [started, timeLeft, onComplete]);

  const handleStart = () => {
    // 1. Play Audio immediately on TAP (Required for Mobile)
    if (audioRef.current) {
        audioRef.current.play().catch(e => console.error("Audio block:", e));
    }
    setStarted(true);
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
    }
    onComplete();
  };

  // --- SCREEN 1: TAP TO START (Fixes Mobile Audio) ---
  if (!started) {
    return (
      <div 
        className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center cursor-pointer p-4"
        onClick={handleStart}
      >
        <div className="text-cyan-400 font-mono text-4xl md:text-6xl tracking-widest uppercase glow-text mb-8 text-center">
          NEON CIRCLE
        </div>
        
        {/* UPDATED TEXT HERE */}
        <div className="animate-pulse border border-cyan-800 bg-cyan-900/20 px-10 py-5 rounded text-cyan-300 text-lg md:text-2xl tracking-[0.2em] font-bold shadow-[0_0_15px_rgba(0,255,255,0.3)] hover:bg-cyan-900/40 transition-all">
          START GAME
        </div>
        
        <div className="mt-4 text-xs text-gray-600 tracking-widest uppercase opacity-60">
          Tap anywhere to begin
        </div>
        
        <style>{`
          .glow-text { text-shadow: 0 0 10px #00FFFF, 0 0 20px #00FFFF, 0 0 40px #00FFFF; }
        `}</style>
      </div>
    );
  }

  // --- SCREEN 2: THE INTRO ---
  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center overflow-hidden p-4">
      
      {/* Background Grid Effect */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* Character Image */}
      <div className="relative mb-8 transition-opacity duration-1000 opacity-100">
         <div className="absolute inset-0 bg-cyan-500 blur-3xl opacity-20 rounded-full"></div>
         <img 
            src="/images/intro-char.png" 
            alt="Character" 
            className="relative w-48 h-48 md:w-80 md:h-80 object-contain drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]"
            onError={(e) => console.error("Missing intro-char.png in /public/images/")}
         />
      </div>

      {/* Main Text */}
      <h1 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter text-center mb-2 glow-text-blue"
          style={{ fontFamily: 'Impact, sans-serif' }}>
        SAYIP OP BROOO
      </h1>

      {/* Sub Text */}
      <p className="text-lg md:text-2xl text-cyan-400 font-mono tracking-[0.3em] text-center opacity-80 mb-8">
        GEOMETRIC PERFECTION
      </p>

      {/* --- LOADING TIMER --- */}
      <div className="flex flex-col items-center gap-2 mb-8">
          <div className="text-cyan-500 font-mono text-sm tracking-widest animate-pulse">
              GAME STARTS IN
          </div>
          <div className="text-4xl font-mono font-bold text-white glow-text-blue">
              00:{timeLeft.toString().padStart(2, '0')}
          </div>
          {/* Progress Bar Visual */}
          <div className="w-48 h-1 bg-gray-800 rounded mt-2 overflow-hidden">
              <div 
                className="h-full bg-cyan-500 transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / 10) * 100}%` }}
              />
          </div>
      </div>

      {/* Skip Button */}
      <button 
        onClick={handleSkip}
        className="px-8 py-3 border border-cyan-800 text-cyan-600 hover:text-cyan-300 hover:border-cyan-400 text-xs tracking-widest uppercase transition-all z-50 bg-black/50 backdrop-blur-sm"
      >
        Skip Intro
      </button>

      <style>{`
        .glow-text-blue {
          text-shadow: 
            2px 2px 0px #000,
            0 0 10px #00FFFF,
            0 0 20px #00FFFF,
            0 0 40px #0000FF;
        }
      `}</style>
    </div>
  );
};

export default Intro;