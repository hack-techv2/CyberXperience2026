'use client';

import { useState, useCallback } from 'react';
import confetti from 'canvas-confetti';

export default function Banner() {
  const [clickCount, setClickCount] = useState(0);
  const [showPopup, setShowPopup] = useState(false);

  const handleBannerClick = useCallback(() => {
    const newCount = clickCount + 1;
    setClickCount(newCount);

    if (newCount >= 5) {
      // Fire confetti!
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.3 },
        colors: ['#00d9ff', '#ff6b6b', '#ffd93d', '#6bff6b', '#ff6bff'],
      });

      // Fire more confetti from the sides
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#00d9ff', '#ff6b6b', '#ffd93d'],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#00d9ff', '#ff6b6b', '#ffd93d'],
      });

      setShowPopup(true);
    }
  }, [clickCount]);

  const handleClosePopup = useCallback(() => {
    setShowPopup(false);
    setClickCount(0); // Reset counter after popup closes
  }, []);

  const asciiArt = `
 ██████╗██╗   ██╗██████╗ ███████╗██████╗ ██╗  ██╗██████╗ ███████╗██████╗ ██╗███████╗███╗   ██╗ ██████╗███████╗    ██████╗  ██████╗ ██████╗  ██████╗
██╔════╝╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗╚██╗██╔╝██╔══██╗██╔════╝██╔══██╗██║██╔════╝████╗  ██║██╔════╝██╔════╝    ╚════██╗██╔═████╗╚════██╗██╔════╝
██║      ╚████╔╝ ██████╔╝█████╗  ██████╔╝ ╚███╔╝ ██████╔╝█████╗  ██████╔╝██║█████╗  ██╔██╗ ██║██║     █████╗       █████╔╝██║██╔██║ █████╔╝███████╗
██║       ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██╗ ██╔██╗ ██╔═══╝ ██╔══╝  ██╔══██╗██║██╔══╝  ██║╚██╗██║██║     ██╔══╝      ██╔═══╝ ████╔╝██║██╔═══╝ ██╔═══██╗
╚██████╗   ██║   ██████╔╝███████╗██║  ██║██╔╝ ██╗██║     ███████╗██║  ██║██║███████╗██║ ╚████║╚██████╗███████╗    ███████╗╚██████╔╝███████╗╚██████╔╝
 ╚═════╝   ╚═╝   ╚═════╝ ╚══════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝     ╚══════╝╚═╝  ╚═╝╚═╝╚══════╝╚═╝  ╚═══╝ ╚═════╝╚══════╝    ╚══════╝ ╚═════╝ ╚══════╝ ╚═════╝
`;

  return (
    <>
      <div
        className="overflow-x-auto cursor-pointer select-none"
        onClick={handleBannerClick}
      >
        <pre className="text-terminal-cyan text-[5px] sm:text-[6px] md:text-[8px] leading-tight whitespace-pre text-center ascii-banner">
          {asciiArt}
        </pre>
        <p className="text-center text-gray-500 text-xs mt-1">
          By Attack Simulation Group (ASG)
        </p>
      </div>

      {/* Easter Egg Popup */}
      {showPopup && (
        <div
          className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
        >
          <div
            className="bg-gray-900 border-2 border-terminal-cyan rounded-lg p-8 max-w-md mx-4 text-center animate-bounce-thrice"
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-terminal-cyan mb-4">
              Easter Egg Found!
            </h2>
            <p className="text-xl text-terminal-yellow mb-6 font-mono">
              SHOUT &quot;EASTER EGG&quot; FOR A PRIZE!
            </p>
            <button
              onClick={handleClosePopup}
              className="px-6 py-3 bg-gray-700 text-terminal-fg rounded font-bold hover:bg-gray-600 border border-gray-600 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
