import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Point, ScoreGrade, ScoreResult, LeaderboardEntry } from './types';
import { calculateScore, getGradeColor } from './utils/scoring';
import { soundEngine } from './utils/audio';
import { LeaderboardService } from './utils/leaderboard';
import ScoreDisplay from './components/ScoreDisplay';
import Mascot from './components/Mascot';
import Intro from './components/Intro';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // --- Game State ---
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [playerPass, setPlayerPass] = useState<string>('');
  
  // --- Auth State ---
  const [inputName, setInputName] = useState('');
  const [inputPass, setInputPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // --- App State ---
  const [view, setView] = useState<'INTRO' | 'AUTH' | 'GAME' | 'LEADERBOARD'>('INTRO');
  const [previousView, setPreviousView] = useState<'AUTH' | 'GAME'>('AUTH');
  const [isMuted, setIsMuted] = useState(false); // <--- NEW MUTE STATE
  
  // --- Drawing State ---
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);
  
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);
  const pointsRef = useRef<Point[]>([]);
  const rectRef = useRef<DOMRect | null>(null);

  // --- NEW: Toggle Mute ---
  const toggleMute = () => {
      const newState = !isMuted;
      setIsMuted(newState);
      soundEngine.setMute(newState);
  };

  // --- Viral Share Function ---
  const handleShare = async () => {
    if (!scoreResult) return;
    const beatPercent = Math.max(10, Math.floor(scoreResult.score - 5)); 
    const text = `🔥 I just got ${scoreResult.score.toFixed(1)}% in Neon Perfect Circle by Sayip OP! ⭕\n\nI beat ${beatPercent}% of global players! 🌍\n\nCan you beat my score? Play here:`;
    const url = window.location.href; 

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Neon Perfect Circle by Sayip OP', text: text, url: url });
      } catch (err) { console.log('Share canceled'); }
    } else {
      navigator.clipboard.writeText(`${text} ${url}`);
      alert('Message copied! Paste it in WhatsApp to challenge friends!');
    }
  };

  // --- Rank Styling ---
  const getRankStyle = (index: number) => {
      switch (index) {
          case 0: return { color: 'text-yellow-400', icon: '🥇' };
          case 1: return { color: 'text-gray-300', icon: '🥈' };
          case 2: return { color: 'text-orange-400', icon: '🥉' };
          default: return { color: 'text-cyan-600', icon: `${index + 1}` };
      }
  };

  // --- Auth Handlers ---
  const handleRegister = async () => {
      if (!inputName || !inputPass) return;
      if (isSubmitting) return;
      setIsSubmitting(true); setLoginError('');
      try {
          const res = await LeaderboardService.register(inputName, inputPass);
          if (res.success) { setPlayerName(inputName); setPlayerPass(inputPass); setView('GAME'); }
          else { setLoginError(res.error || "Registration Failed"); }
      } catch (e) { setLoginError("Network/Server Error. Try again."); } finally { setIsSubmitting(false); }
  };

  const handleLogin = async () => {
      if (!inputName || !inputPass) return;
      if (isSubmitting) return;
      setIsSubmitting(true); setLoginError('');
      try {
          const res = await LeaderboardService.login(inputName, inputPass);
          if (res.success) { setPlayerName(inputName); setPlayerPass(inputPass); setView('GAME'); }
          else { setLoginError(res.error || "Login Failed"); }
      } catch (e) { setLoginError("Network Error. Check internet."); } finally { setIsSubmitting(false); }
  };

  const handleGuestPlay = () => { setPlayerName("GUEST"); setPlayerPass(""); setView('GAME'); };

  const handleLogout = () => {
      setPlayerName(null); setPlayerPass(''); setInputName(''); setInputPass('');
      setScoreResult(null); setHasDrawn(false); setShowInstructions(true);
      renderPath([]); setView('AUTH');
  };

  // --- Canvas Init ---
  const initCanvas = useCallback(() => {
    if (view !== 'GAME') return;
    const canvas = canvasRef.current; const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect(); rectRef.current = rect;
    canvas.width = rect.width * dpr; canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = 4; ctx.shadowBlur = 15; ctx.shadowColor = '#00FFFF'; ctx.strokeStyle = '#00FFFF';
    }
    canvas.style.width = `${rect.width}px`; canvas.style.height = `${rect.height}px`;
  }, [view]);

  useEffect(() => {
    window.addEventListener('resize', initCanvas);
    if (view === 'GAME') setTimeout(initCanvas, 50);
    return () => window.removeEventListener('resize', initCanvas);
  }, [initCanvas, view]);

  // --- Leaderboard Loader ---
  useEffect(() => {
      const loadScores = async () => {
          const scores = await LeaderboardService.getScores();
          if (Array.isArray(scores)) setLeaderboardData(scores);
      };
      loadScores();
  }, [view]);

  // --- Rendering Logic ---
  const renderPath = (points: Point[]) => {
    const canvas = canvasRef.current; if (!canvas || points.length === 0) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const width = canvas.width / (window.devicePixelRatio || 1);
    const height = canvas.height / (window.devicePixelRatio || 1);
    ctx.clearRect(0, 0, width, height);

    const getStyle = (speed: number = 0, time: number = 0) => {
       const s = Math.min(speed, 5); const n = s / 5; 
       const lineWidth = Math.max(1.5, 5.5 - (n * 3));
       const hue = 180 + (n * 25) + (Math.sin(time * 0.005) * 8);
       return { lineWidth, strokeStyle: `hsl(${hue}, 100%, ${50 + n * 45}%)`, shadowBlur: 10 + (n * 25), shadowColor: `hsl(${hue}, 100%, ${50 + n * 45}%)` };
    };

    if (points.length < 2) {
        if (points.length === 1) {
             const p = points[0]; const style = getStyle(0, p.time || Date.now());
             ctx.beginPath(); ctx.fillStyle = style.strokeStyle;
             ctx.shadowColor = style.shadowColor; ctx.shadowBlur = style.shadowBlur;
             ctx.arc(p.x, p.y, style.lineWidth, 0, Math.PI * 2); ctx.fill();
        } return;
    }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (points.length === 2) {
        const style = getStyle(points[1].speed, points[1].time || 0);
        ctx.beginPath(); ctx.lineWidth = style.lineWidth; ctx.strokeStyle = style.strokeStyle;
        ctx.shadowBlur = style.shadowBlur; ctx.shadowColor = style.shadowColor;
        ctx.moveTo(points[0].x, points[0].y); ctx.lineTo(points[1].x, points[1].y); ctx.stroke();
        return;
    }
    let currentX = points[0].x; let currentY = points[0].y;
    for (let i = 1; i < points.length - 1; i++) {
        const pControl = points[i]; const pNext = points[i+1];
        let endX = (i === points.length - 2) ? pNext.x : (pControl.x + pNext.x) / 2;
        let endY = (i === points.length - 2) ? pNext.y : (pControl.y + pNext.y) / 2;
        const style = getStyle(pControl.speed, pControl.time || 0);
        ctx.beginPath(); ctx.lineWidth = style.lineWidth; ctx.strokeStyle = style.strokeStyle;
        ctx.shadowBlur = style.shadowBlur; ctx.shadowColor = style.shadowColor;
        ctx.moveTo(currentX, currentY); ctx.quadraticCurveTo(pControl.x, pControl.y, endX, endY); ctx.stroke();
        currentX = endX; currentY = endY;
    }
  };

  const drawIdealCircle = (center: Point, radius: number) => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.save(); ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.shadowBlur = 5; ctx.shadowColor = '#FFFFFF'; ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]); ctx.beginPath();
    ctx.arc(center.x, center.y, radius, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
  };

  const startDrawing = (clientX: number, clientY: number) => {
    setScoreResult(null); setShowInstructions(false); setHasDrawn(false); setIsDrawing(true);
    soundEngine.startHum();
    let x = rectRef.current ? clientX - rectRef.current.left : clientX;
    let y = rectRef.current ? clientY - rectRef.current.top : clientY;
    pointsRef.current = [{ x, y, time: Date.now(), speed: 0 }];
    renderPath(pointsRef.current);
  };

  const draw = (clientX: number, clientY: number) => {
    if (!isDrawing) return;
    let x = rectRef.current ? clientX - rectRef.current.left : clientX;
    let y = rectRef.current ? clientY - rectRef.current.top : clientY;
    const last = pointsRef.current[pointsRef.current.length - 1];
    if (Math.abs(last.x - x) < 2 && Math.abs(last.y - y) < 2) return;
    pointsRef.current.push({ x, y, time: Date.now(), speed: (Math.hypot(x - last.x, y - last.y) / (Date.now() - (last.time || Date.now()))) });
    renderPath(pointsRef.current);
    if (pointsRef.current.length > 20 && pointsRef.current.length % 4 === 0) {
        const liveResult = calculateScore(pointsRef.current, true);
        if (liveResult) setScoreResult(liveResult);
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false); soundEngine.stopHum();
    const points = pointsRef.current;
    if (points.length > 20) {
      const result = calculateScore(points, false);
      if (result) {
        setScoreResult(result); setHasDrawn(true);
        if (playerName && playerPass && result.score > 0) {
            (async () => {
                await LeaderboardService.saveScore(playerName, playerPass, result.score);
                const freshScores = await LeaderboardService.getScores();
                if (Array.isArray(freshScores)) setLeaderboardData(freshScores);
            })();
        }
        const color = getGradeColor(result.grade);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && canvas) {
             const width = canvas.width / (window.devicePixelRatio || 1);
             const height = canvas.height / (window.devicePixelRatio || 1);
             ctx.clearRect(0, 0, width, height);
             ctx.beginPath(); ctx.strokeStyle = color; ctx.shadowColor = color;
             ctx.shadowBlur = 20; ctx.lineWidth = 4;
             if (points.length > 1) {
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length - 2; i++) {
                    const xc = (points[i].x + points[i + 1].x) / 2;
                    const yc = (points[i].y + points[i + 1].y) / 2;
                    ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
                }
                const i = points.length - 2;
                ctx.quadraticCurveTo(points[i].x, points[i].y, points[i+1].x, points[i+1].y);
                ctx.stroke();
             }
        }
        drawIdealCircle(result.center, result.avgRadius);
        soundEngine.playResult(result.grade);
      } else { renderPath([]); setShowInstructions(true); setScoreResult(null); }
    } else { renderPath([]); setShowInstructions(true); setScoreResult(null); }
  };

  // --- Handlers ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (containerRef.current) rectRef.current = containerRef.current.getBoundingClientRect();
    startDrawing(e.clientX, e.clientY);
  };
  const handleMouseMove = (e: React.MouseEvent) => { draw(e.clientX, e.clientY); };
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault(); 
    if (containerRef.current) rectRef.current = containerRef.current.getBoundingClientRect();
    startDrawing(e.touches[0].clientX, e.touches[0].clientY);
  };
  const handleTouchMove = (e: React.TouchEvent) => { e.preventDefault(); draw(e.touches[0].clientX, e.touches[0].clientY); };
  const handleTouchEnd = (e: React.TouchEvent) => { e.preventDefault(); stopDrawing(); };

  return (
    <div ref={containerRef} className="relative w-full h-[100dvh] bg-[#050505] overflow-hidden select-none font-mono text-cyan-500" style={{ touchAction: 'none' }}>
        <div className="scanlines" />

        {/* --- GLOBAL MUTE BUTTON --- */}
        {view !== 'INTRO' && (
            <button 
                onClick={toggleMute} 
                className="fixed top-4 right-4 z-50 p-2 text-xl hover:text-white transition-colors"
                style={{ filter: 'drop-shadow(0 0 5px #00FFFF)' }}
            >
                {isMuted ? '🔇' : '🔊'}
            </button>
        )}

        {/* --- VIEW: INTRO --- */}
        {view === 'INTRO' && (
            <Intro onComplete={() => setView('AUTH')} />
        )}

        {/* --- VIEW: AUTH SCREEN --- */}
        {view === 'AUTH' && (
            <div className="absolute inset-0 flex items-center justify-center z-50 bg-[#050505] p-4">
                <div className="flex flex-col items-center w-full max-w-md p-6 border-2 border-cyan-500 rounded-lg shadow-[0_0_30px_rgba(0,255,255,0.3)] bg-black/80 relative">
                    <h1 className="text-3xl font-bold mb-6 tracking-widest text-white glow-text text-center">NEON CIRCLE</h1>
                    
                    <div className="w-full space-y-4 mb-6">
                        <div><label className="block text-xs uppercase tracking-wider mb-1 text-cyan-700">Your Name</label>
                        <input type="text" maxLength={12} value={inputName} onChange={(e) => setInputName(e.target.value)} className="w-full bg-cyan-900/10 border border-cyan-700 p-3 text-white focus:outline-none focus:border-cyan-400 uppercase text-center rounded" disabled={isSubmitting} /></div>
                        <div><label className="block text-xs uppercase tracking-wider mb-1 text-cyan-700">Password</label>
                        <input type="password" value={inputPass} onChange={(e) => setInputPass(e.target.value)} className="w-full bg-cyan-900/10 border border-cyan-700 p-3 text-white focus:outline-none focus:border-cyan-400 text-center rounded" disabled={isSubmitting} /></div>
                        {loginError && <div className="text-red-500 text-xs text-center font-bold animate-pulse">{loginError}</div>}
                    </div>
                    
                    <div className="flex gap-4 w-full mb-4">
                        <button onClick={handleLogin} disabled={isSubmitting} className="flex-1 neon-btn-blue">{isSubmitting ? '...' : 'LOGIN'}</button>
                        <button onClick={handleRegister} disabled={isSubmitting} className="flex-1 neon-btn-blue">{isSubmitting ? '...' : 'REGISTER'}</button>
                    </div>

                    <button onClick={handleGuestPlay} className="text-xs text-cyan-700 hover:text-cyan-400 underline mb-6 uppercase tracking-wider transition-colors">Play as Guest (No Save)</button>

                    <button onClick={() => { setPreviousView('AUTH'); setView('LEADERBOARD'); }} className="w-full neon-btn-blue text-xs py-3">VIEW GLOBAL RANKINGS</button>

                    {leaderboardData.length > 0 && (
                        <div className="mt-6 w-full border-t border-cyan-900 pt-4"><h3 className="text-center text-xs mb-2 text-cyan-700 uppercase">Current Champion</h3><div className="flex justify-between text-sm text-cyan-500"><span>{leaderboardData[0].name}</span><span>{leaderboardData[0].score.toFixed(1)}%</span></div></div>
                    )}
                </div>
            </div>
        )}

        {/* --- VIEW: GAME SCREEN --- */}
        {view === 'GAME' && (
            <>
                <div className="absolute top-4 left-4 right-16 z-20 flex justify-between items-start text-xs opacity-90">
                    <div className="flex flex-col gap-1">
                        <div><span className="text-cyan-800">AGENT:</span> <span className="text-cyan-300 font-bold">{playerName}</span></div>
                        <button onClick={handleLogout} className="text-red-500 hover:text-red-300 underline text-[10px] uppercase text-left">LOGOUT</button>
                    </div>
                    <button onClick={() => { setPreviousView('GAME'); setView('LEADERBOARD'); }} className="neon-btn-blue px-4 py-1 text-[10px]">RANKINGS</button>
                </div>

                <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 pointer-events-none z-10 ${showInstructions ? 'opacity-100' : 'opacity-0'}`}>
                    <div className="text-center">
                        <h1 className="text-cyan-400 font-mono text-2xl md:text-4xl tracking-widest uppercase glow-text mb-4">Draw a Perfect Circle</h1>
                        <p className="text-cyan-700 font-mono text-sm animate-pulse">Touch & Drag</p>
                    </div>
                </div>

                {scoreResult && <ScoreDisplay result={scoreResult} isLive={isDrawing} />}
                <Mascot isDrawing={isDrawing} grade={hasDrawn && scoreResult ? scoreResult.grade : null} />
                <canvas ref={canvasRef} className="absolute inset-0 cursor-crosshair z-0" onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ touchAction: 'none' }} />
                
                {!isDrawing && hasDrawn && (
                    <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 flex flex-col gap-3 z-30 w-full max-w-xs px-6 animate-pop-in">
                        <button onClick={() => { renderPath([]); setScoreResult(null); setShowInstructions(true); setHasDrawn(false); }} className="w-full neon-btn-blue py-3 text-sm">RETRY</button>
                        <button onClick={handleShare} className="w-full neon-btn-blue py-3 text-sm">SHARE SCORE</button>
                    </div>
                )}
            </>
        )}

        {/* --- VIEW: LEADERBOARD --- */}
        {view === 'LEADERBOARD' && (
            <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center p-4">
                 <div className="w-full max-w-lg p-6 border border-cyan-900 bg-[#0a0a0a] relative max-h-[90dvh] overflow-y-auto rounded-lg shadow-[0_0_50px_rgba(0,0,255,0.2)]">
                    <button onClick={() => setView(previousView)} className="absolute top-4 right-4 text-cyan-700 hover:text-cyan-400 text-xl">✕</button>
                    <h2 className="text-2xl text-center mb-6 text-white uppercase tracking-widest glow-text">Global Rankings</h2>
                    <div className="w-full">
                        <div className="flex justify-between text-xs text-cyan-800 mb-2 px-2 uppercase"><span>Rank</span><span className="flex-1 ml-8">Agent</span><span>Score</span></div>
                        {leaderboardData.map((entry, index) => {
                            const rank = getRankStyle(index);
                            return (
                                <div key={index} className={`flex justify-between items-center py-3 px-2 border-b border-cyan-900/30 ${entry.name === playerName ? 'bg-cyan-900/20' : ''}`}>
                                    <span className={`w-8 font-bold ${rank.color} text-lg`}>{rank.icon}</span>
                                    <span className={`flex-1 ml-4 truncate ${entry.name === playerName ? 'text-white' : 'text-cyan-500'}`}>{entry.name}</span>
                                    <span className={`font-bold ${index === 0 ? 'text-green-400' : 'text-cyan-300'}`}>{entry.score.toFixed(1)}%</span>
                                </div>
                            );
                        })}
                    </div>
                    <div className="mt-8 text-center"><button onClick={() => setView(previousView)} className="neon-btn-blue px-8 py-2 text-sm">RETURN</button></div>
                 </div>
            </div>
        )}
        
        <style>{`
            .glow-text { text-shadow: 0 0 10px #00FFFF, 0 0 20px #00FFFF; }
            
            .neon-btn-blue {
                background: rgba(0, 50, 100, 0.3);
                border: 1px solid #00FFFF;
                color: #00FFFF;
                font-family: monospace;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.15em;
                padding: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                border-radius: 2px;
                box-shadow: 0 0 5px rgba(0, 255, 255, 0.2);
            }
            .neon-btn-blue:hover {
                background: #00FFFF;
                color: #000;
                box-shadow: 0 0 20px #00FFFF, 0 0 40px #00FFFF;
                transform: translateY(-1px);
            }
            .neon-btn-blue:disabled { opacity: 0.5; cursor: not-allowed; box-shadow: none; }

            @keyframes popIn { 0% { transform: translate(-50%, 20px); opacity: 0; } 100% { transform: translate(-50%, 0); opacity: 1; } }
            .animate-pop-in { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        `}</style>
    </div>
  );
};

export default App;