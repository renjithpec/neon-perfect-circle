export interface Point {
  x: number;
  y: number;
  time?: number;
  speed?: number;
}

export enum ScoreGrade {
  EXCELLENT = 'EXCELLENT',
  OKAY = 'OKAY',
  BAD = 'BAD',
  NONE = 'NONE'
}

export interface ScoreResult {
  score: number;
  grade: ScoreGrade;
  center: Point;
  avgRadius: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  date: number;
}