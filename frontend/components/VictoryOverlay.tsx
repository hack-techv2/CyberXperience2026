'use client';

import { useState, useCallback } from 'react';
import Cookies from 'js-cookie';
import { decodeJWT } from '@/lib/jwt';
import confetti from 'canvas-confetti';

const COOKIE_NAME = 'ctf_session';
const REQUIRED_STAGES = ['stage1', 'stage2', 'stage3'];

/**
 * Verify the JWT cookie directly — reads from the cookie, not React state.
 * Returns true only if flags_solved === 3 AND solved_stages contains all 3 stage IDs (exactly).
 */
export function verifyVictoryJWT(): boolean {
  try {
    const token = Cookies.get(COOKIE_NAME);
    if (!token) return false;

    const decoded = decodeJWT(token);
    if (!decoded?.payload) return false;

    const { flags_solved, solved_stages } = decoded.payload;

    if (flags_solved !== 3) return false;
    if (!Array.isArray(solved_stages)) return false;
    if (solved_stages.length !== 3) return false;

    // Must contain exactly the 3 required stages
    const hasAll = REQUIRED_STAGES.every((s) => solved_stages.includes(s));
    return hasAll;
  } catch {
    return false;
  }
}

function fireCelebration() {
  const duration = 4000;
  const end = Date.now() + duration;

  // Initial big burst
  confetti({
    particleCount: 200,
    spread: 100,
    origin: { y: 0.4 },
    colors: ['#00d9ff', '#ff6b6b', '#ffd93d', '#6bff6b', '#ff6bff', '#bc8cff'],
  });

  // Side bursts
  confetti({ particleCount: 80, angle: 60, spread: 60, origin: { x: 0, y: 0.5 }, colors: ['#00d9ff', '#ffd93d'] });
  confetti({ particleCount: 80, angle: 120, spread: 60, origin: { x: 1, y: 0.5 }, colors: ['#ff6b6b', '#bc8cff'] });

  // Ongoing salvos
  const interval = setInterval(() => {
    if (Date.now() > end) {
      clearInterval(interval);
      return;
    }
    confetti({
      particleCount: 40,
      spread: 80,
      origin: { x: Math.random(), y: Math.random() * 0.4 },
      colors: ['#00d9ff', '#ff6b6b', '#ffd93d', '#6bff6b'],
    });
  }, 600);
}

const ASCII_TROPHY = [
  '   ___________',
  "  '._==_==_=_.'",
  '  .-\\:      /-.',
  ' | (|:.     |) |',
  "  '-|:.     |-'",
  '    \\::.    /',
  "     '::. .'",
  '       ) (',
  "     _.' '._",
  "    '-------'",
].join('\n');

export default function VictoryOverlay() {
  const [showOverlay, setShowOverlay] = useState(false);

  const handleClick = useCallback(() => {
    // Double-check JWT directly from cookie on click
    if (!verifyVictoryJWT()) return;

    setShowOverlay(true);
    fireCelebration();
  }, []);

  return (
    <>
      {/* Victory button in the status bar */}
      <button
        onClick={handleClick}
        className="ml-3 px-3 py-1 rounded text-xs font-bold bg-terminal-green/20 text-terminal-green border border-terminal-green/40 hover:bg-terminal-green/30 hover:border-terminal-green/60 transition-colors victory-pulse-border cursor-pointer flex items-center gap-1.5"
      >
        <span>&#9733;</span>
        <span>Claim Victory</span>
      </button>

      {/* Full-screen celebration overlay */}
      {showOverlay && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => setShowOverlay(false)}
        >
          <div className="text-center victory-fade-in">
            <pre className="text-terminal-yellow text-sm md:text-base leading-tight mb-4 font-mono inline-block text-left">
              {ASCII_TROPHY}
            </pre>
            <h1 className="text-3xl md:text-5xl font-bold text-terminal-cyan mb-4 tracking-wider">
              ALL STAGES CLEARED
            </h1>
            <p className="text-terminal-green text-lg md:text-xl font-mono mb-2">
              {'>'} flags_solved: 3/3
            </p>
            <p className="text-gray-400 text-sm font-mono mb-6">
              Congratulations, you conquered every challenge!
            </p>
            <button
              onClick={() => setShowOverlay(false)}
              className="px-6 py-2 bg-gray-800 text-terminal-fg rounded font-mono text-sm hover:bg-gray-700 border border-gray-600 transition-colors"
            >
              [ close ]
            </button>
          </div>
        </div>
      )}
    </>
  );
}
