import { LeaderboardEntry } from '../types';
const API_URL = '/api.php'; 

export const LeaderboardService = {
  getScores: async (): Promise<LeaderboardEntry[]> => {
    try { const r = await fetch(API_URL); return await r.json(); } catch { return []; }
  },
  register: async (name: string, password: string) => {
    const r = await fetch(API_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({action:'register', name, password})});
    return await r.json();
  },
  login: async (name: string, password: string) => {
    const r = await fetch(API_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({action:'login', name, password})});
    return await r.json();
  },
  saveScore: async (name: string, password: string, score: number) => {
    await fetch(API_URL, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({action:'save', name, password, score})});
  }
};