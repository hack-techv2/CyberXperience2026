'use client';

interface TabSelectorProps {
  activeTab: 'web' | 'terminal';
  onTabChange: (tab: 'web' | 'terminal') => void;
}

export default function TabSelector({ activeTab, onTabChange }: TabSelectorProps) {
  return (
    <div className="flex border-b border-gray-800 bg-gray-900">
      <button
        className={`tab flex items-center gap-2 ${activeTab === 'web' ? 'active' : ''}`}
        onClick={() => onTabChange('web')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
        </svg>
        <span>Stage 1: Web Explorer</span>
        <span className="text-xs px-2 py-0.5 bg-terminal-cyan/20 text-terminal-cyan rounded">
          Path Traversal
        </span>
      </button>

      <button
        className={`tab flex items-center gap-2 ${activeTab === 'terminal' ? 'active' : ''}`}
        onClick={() => onTabChange('terminal')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>Stage 2 & 3: Shell Terminal</span>
        <span className="text-xs px-2 py-0.5 bg-terminal-yellow/20 text-terminal-yellow rounded mr-1">
          Injection
        </span>
        <span className="text-xs px-2 py-0.5 bg-terminal-red/20 text-terminal-red rounded">
          PrivEsc
        </span>
      </button>
    </div>
  );
}
