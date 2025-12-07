import { Point, ScoreGrade, ScoreResult } from '../types';

// Standard Kasa Circle Fit Algorithm (The most accurate for this game)
const fitCircle = (points: Point[]): { x: number, y: number, r: number } | null => {
  const n = points.length;
  if (n < 3) return null;

  let sumX = 0, sumY = 0, sumX2 = 0, sumY2 = 0, sumXY = 0;
  let sumX3 = 0, sumY3 = 0, sumXY2 = 0, sumX2Y = 0;

  for (const p of points) {
    const x = p.x; const y = p.y; const x2 = x * x; const y2 = y * y;
    sumX += x; sumY += y; sumX2 += x2; sumY2 += y2; sumXY += x * y;
    sumX3 += x * x2; sumY3 += y * y2; sumXY2 += x * y2; sumX2Y += x2 * y;
  }

  const a11 = sumX2, a12 = sumXY, a13 = sumX;
  const a21 = sumXY, a22 = sumY2, a23 = sumY;
  const a31 = sumX, a32 = sumY, a33 = n;
  const b1 = sumX3 + sumXY2, b2 = sumX2Y + sumY3, b3 = sumX2 + sumY2;

  const det = a11 * (a22 * a33 - a23 * a32) - a12 * (a21 * a33 - a23 * a31) + a13 * (a21 * a32 - a22 * a31);
  if (Math.abs(det) < 1e-9) return null;

  const detA = b1 * (a22 * a33 - a23 * a32) - a12 * (b2 * a33 - a23 * b3) + a13 * (b2 * a32 - a22 * b3);
  const detB = a11 * (b2 * a33 - a23 * b3) - b1 * (a21 * a33 - a23 * a31) + a13 * (a21 * b3 - b2 * a31);
  const detC = a11 * (a22 * b3 - b2 * a32) - a12 * (a21 * b3 - b2 * a31) + b1 * (a21 * a32 - a22 * a31);

  const centerX = (detA / det) / 2;
  const centerY = (detB / det) / 2;
  const radius = Math.sqrt(Math.max(0, (detC / det) + centerX * centerX + centerY * centerY));

  return { x: centerX, y: centerY, r: radius };
};

export const calculateScore = (points: Point[], isLive: boolean = false): ScoreResult | null => {
  // Need at least 10 points to judge a circle
  if (points.length < 10) return null;

  const fit = fitCircle(points);
  if (!fit) return null;

  const { x: centerX, y: centerY, r: fitRadius } = fit;
  
  // 1. Calculate how bumpy/imperfect the circle is (Standard Deviation)
  let sumSquaredDiffs = 0;
  for (const p of points) {
    const dist = Math.sqrt(Math.pow(p.x - centerX, 2) + Math.pow(p.y - centerY, 2));
    sumSquaredDiffs += Math.pow(dist - fitRadius, 2);
  }
  const normalizedDev = Math.sqrt(sumSquaredDiffs / points.length) / fitRadius;
  
  // 2. Base Score Calculation
  // 1.0% deviation = ~94% score. This feels "fair" to players.
  let rawScore = 100 * (1 - (normalizedDev * 6));

  // 3. Closure Check (Only for Final Score)
  // We don't punish open gaps while drawing, only when you stop.
  if (!isLive) {
    const startPoint = points[0];
    const endPoint = points[points.length - 1];
    const gap = Math.sqrt(Math.pow(startPoint.x - endPoint.x, 2) + Math.pow(startPoint.y - endPoint.y, 2));
    const normalizedGap = gap / fitRadius;

    // Only subtract points if the gap is visibly large (>6% of radius)
    // This prevents the score from dropping randomly for tiny gaps.
    if (normalizedGap > 0.06) {
      const penalty = Math.min(1.0, normalizedGap) * 0.5; // Max 50% penalty for unclosed circles
      rawScore *= (1 - penalty);
    }
  }

  // 4. Clamp & Round
  let finalScore = Math.max(0, Math.min(100, rawScore));
  finalScore = Math.round(finalScore * 10) / 10;

  let grade = ScoreGrade.BAD;
  if (finalScore >= 95) grade = ScoreGrade.EXCELLENT;
  else if (finalScore >= 80) grade = ScoreGrade.OKAY;

  return { score: finalScore, grade, center: { x: centerX, y: centerY }, avgRadius: fitRadius };
};

export const getGradeColor = (grade: ScoreGrade): string => {
  switch (grade) {
    case ScoreGrade.EXCELLENT: return '#00FF00'; // Green
    case ScoreGrade.OKAY: return '#FFFF00';      // Yellow
    default: return '#FF0000';                   // Red
  }
};