import React from 'react';
import { ScoreGrade } from '../types';

interface MascotProps { isDrawing: boolean; grade: ScoreGrade | null; }

const Mascot: React.FC<MascotProps> = ({ isDrawing, grade }) => {
  let imageSrc = '/images/char-idle.png';
  let animationClass = 'animate-float';

  if (isDrawing) { imageSrc = '/images/char-draw.png'; animationClass = 'scale-110'; }
  else if (grade) {
    switch (grade) {
      case ScoreGrade.EXCELLENT: imageSrc = '/images/char-perfect.png'; animationClass = 'animate-pop-success'; break;
      case ScoreGrade.OKAY: imageSrc = '/images/char-okay.png'; animationClass = 'animate-bounce-gentle'; break;
      case ScoreGrade.BAD: imageSrc = '/images/char-bad.png'; animationClass = 'animate-pop-fail'; break;
    }
  }

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 md:right-8 w-32 h-32 md:w-40 md:h-40 z-40 pointer-events-none transition-all duration-300">
      <img src={imageSrc} alt="Mascot" className={`w-full h-full object-contain drop-shadow-[0_0_15px_rgba(0,255,255,0.5)] ${animationClass}`} />
      <style>{`
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } } .animate-float { animation: float 3s infinite ease-in-out; }
        @keyframes pop-success { 0% { transform: scale(0.5) translateY(20px); opacity: 0; } 40% { transform: scale(1.2) translateY(-20px); opacity: 1; } 100% { transform: scale(1) translateY(0); } } .animate-pop-success { animation: pop-success 0.6s ease-out forwards; }
        @keyframes pop-fail { 0% { transform: scale(0.8) rotate(0deg); opacity: 0; } 25% { transform: scale(1.1) rotate(-10deg); opacity: 1; } 50% { transform: scale(1.1) rotate(10deg); } 100% { transform: scale(1) rotate(0deg); } } .animate-pop-fail { animation: pop-fail 0.5s ease-out forwards; }
        @keyframes bounce-gentle { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-15px); } } .animate-bounce-gentle { animation: bounce-gentle 2s infinite; }
      `}</style>
    </div>
  );
};
export default Mascot;