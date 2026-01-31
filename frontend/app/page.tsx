'use client';

import { useState } from 'react';
import Banner from '@/components/Banner';
import TabSelector from '@/components/TabSelector';
import WebExplorer from '@/components/WebExplorer';
import ShellTerminal from '@/components/ShellTerminal';
import FlagTracker from '@/components/FlagTracker';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'web' | 'terminal'>('web');
  const [flags, setFlags] = useState<string[]>([]);

  const addFlag = (flag: string) => {
    if (!flags.includes(flag)) {
      setFlags([...flags, flag]);
    }
  };

  return (
    <main className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-gray-800 p-2 flex-shrink-0">
        <Banner />
      </header>

      {/* Status Bar */}
      <div className="bg-gray-900 border-b border-gray-800 px-4 py-1 flex justify-between items-center flex-shrink-0">
        <FlagTracker flags={flags} />
        <div className="text-sm text-gray-500">
          CyberXperience 2026 | The Shell Chronicles
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex-shrink-0">
        <TabSelector activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden min-h-0">
        {activeTab === 'web' ? (
          <WebExplorer onFlagFound={addFlag} />
        ) : (
          <ShellTerminal onFlagFound={addFlag} />
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 p-1 text-center text-xs text-gray-600 flex-shrink-0">
        <span>Built for educational purposes | </span>
        <span className="text-terminal-cyan">Stage 1: Information Disclosure</span>
        <span> | </span>
        <span className="text-terminal-yellow">Stage 2: Command Injection</span>
        <span> | </span>
        <span className="text-terminal-red">Stage 3: Privilege Escalation</span>
      </footer>
    </main>
  );
}
