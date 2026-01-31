'use client';

interface FlagTrackerProps {
  flags: string[];
}

export default function FlagTracker({ flags }: FlagTrackerProps) {
  const stages = [
    { name: 'Stage 1', pattern: 'p4th_tr4v3rs4l' },
    { name: 'Stage 2', pattern: 'c0mm4nd_1nj3ct10n' },
    { name: 'Stage 3', pattern: 'gtf0_f1nd' },
  ];

  const isStageComplete = (pattern: string) => {
    return flags.some(flag => flag.includes(pattern));
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-400">Flags Captured:</span>
      <div className="flex gap-2">
        {stages.map((stage, index) => (
          <div
            key={index}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              isStageComplete(stage.pattern)
                ? 'bg-terminal-green/20 text-terminal-green'
                : 'bg-gray-800 text-gray-500'
            }`}
          >
            <svg
              className="w-3 h-3"
              fill={isStageComplete(stage.pattern) ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isStageComplete(stage.pattern) ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
            <span>{stage.name}</span>
          </div>
        ))}
      </div>
      <span className="text-terminal-green font-bold">
        {flags.length} / 3
      </span>
    </div>
  );
}
