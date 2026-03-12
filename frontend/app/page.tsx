'use client';

import { useState, useEffect, useCallback } from 'react';
import Banner from '@/components/Banner';
import TabSelector from '@/components/TabSelector';
import WebExplorer from '@/components/WebExplorer';
import ShellTerminal from '@/components/ShellTerminal';
import BabyShell from '@/components/BabyShell';
import ExperienceModal from '@/components/ExperienceModal';
import FlagTracker from '@/components/FlagTracker';
import VictoryOverlay from '@/components/VictoryOverlay';
import { useFlagJWT } from '@/hooks/useFlagJWT';
import { useTheme } from '@/contexts/ThemeContext';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'baby' | 'web' | 'terminal'>('web');
  const {
    solvedStages,
    flagsCount,
    foundCreds,
    validateFlag,
    storeCredentials,
    refreshFromCookie,
    isInitialized,
    // Baby Shell fields
    experienceLevel,
    babyShellStep,
    babyShellCompleted,
    setExperienceLevel,
    validateBabyShellStep,
  } = useFlagJWT();
  const { theme, toggleTheme } = useTheme();

  // Handle experience level selection from modal
  const handleExperienceSelect = useCallback(async (level: 'beginner' | 'experienced') => {
    await setExperienceLevel(level);
    // If beginner, switch to Baby Shell tab
    if (level === 'beginner') {
      setActiveTab('baby');
    }
  }, [setExperienceLevel]);

  // Poll cookie every 2 seconds to detect manual JWT modifications
  useEffect(() => {
    const interval = setInterval(() => {
      refreshFromCookie();
    }, 2000);

    return () => clearInterval(interval);
  }, [refreshFromCookie]);

  // Auto-redirect beginners to Stage 0 on page load
  useEffect(() => {
    if (isInitialized && experienceLevel === 'beginner' && !babyShellCompleted) {
      setActiveTab('baby');
    }
  }, [isInitialized, experienceLevel, babyShellCompleted]);

  // Show loading state while JWT initializes
  if (!isInitialized) {
    return (
      <main className="h-screen flex items-center justify-center bg-gray-950">
        <div className="text-terminal-cyan animate-pulse">Initializing...</div>
      </main>
    );
  }

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-gray-800 p-2 flex-shrink-0">
        <Banner />
      </header>

      {/* Status Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-1 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center">
          <FlagTracker
            solvedStages={solvedStages}
            flagsCount={flagsCount}
            babyShellStep={babyShellStep}
            babyShellCompleted={babyShellCompleted}
          />
          {flagsCount === 3 && <VictoryOverlay />}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleTheme();
            }}
            className="px-3 py-1.5 rounded bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-600 transition-colors flex items-center gap-2"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <>
                <svg className="w-5 h-5 text-terminal-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-sm text-gray-300">Dark</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 text-terminal-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
                <span className="text-sm text-gray-600">Light</span>
              </>
            )}
          </button>
          <div className="text-sm text-gray-500">
            CyberXperience 2026 | The Shell Chronicles
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex-shrink-0">
        <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content - All components are rendered but only one is visible */}
      {/* This preserves state when switching tabs */}
      <div className="flex-1 overflow-hidden min-h-0 relative">
        <div className={`absolute inset-0 ${activeTab === 'baby' ? '' : 'invisible'}`}>
          <BabyShell
            currentStep={babyShellStep}
            onStepComplete={validateBabyShellStep}
            isCompleted={babyShellCompleted}
          />
        </div>
        <div className={`absolute inset-0 ${activeTab === 'web' ? '' : 'invisible'}`}>
          <WebExplorer
            onFlagCandidate={validateFlag}
            onCredentialsFound={storeCredentials}
          />
        </div>
        <div className={`absolute inset-0 ${activeTab === 'terminal' ? '' : 'invisible'}`}>
          <ShellTerminal
            onFlagCandidate={validateFlag}
            foundCreds={foundCreds}
          />
        </div>
      </div>

      {/* Experience Modal - shown on first visit */}
      {experienceLevel === 'unknown' && (
        <ExperienceModal onSelect={handleExperienceSelect} />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 p-1 text-center text-xs text-gray-600 flex-shrink-0">
        <span>Built for educational purposes | </span>
        <span className="text-terminal-purple">Stage 0: Baby Shell</span>
        <span> | </span>
        <span className="text-terminal-cyan">Stage 1: Shell Breakout</span>
        <span> | </span>
        <span className="text-terminal-yellow">Stage 2: Command Injection</span>
        <span> | </span>
        <span className="text-terminal-red">Stage 3: Privilege Escalation</span>
      </footer>
    </main>
  );
}
