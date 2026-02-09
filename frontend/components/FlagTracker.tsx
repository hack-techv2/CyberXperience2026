'use client';

interface FlagTrackerProps {
  solvedStages: string[];
  flagsCount: number;
  babyShellStep?: number;
  babyShellCompleted?: boolean;
}

const STAGES = [
  { id: 'stage1', name: 'Stage 1' },
  { id: 'stage2', name: 'Stage 2' },
  { id: 'stage3', name: 'Stage 3' },
];

export default function FlagTracker({ solvedStages, flagsCount, babyShellStep = 0, babyShellCompleted = false }: FlagTrackerProps) {
  const isStageComplete = (stageId: string) => {
    return solvedStages.includes(stageId);
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-400">Progress:</span>
      <div className="flex gap-2">
        {/* Stage 0: Baby Shell */}
        <div
          className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
            babyShellCompleted
              ? 'bg-terminal-green/20 text-terminal-green'
              : babyShellStep > 0
                ? 'bg-terminal-purple/20 text-terminal-purple'
                : 'bg-gray-800 text-gray-500'
          }`}
        >
          {babyShellCompleted ? (
            <svg className="w-3 h-3" fill="currentColor" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <span className="text-[10px] font-mono">{babyShellStep}/10</span>
          )}
          <span>Stage 0</span>
        </div>

        {/* Stages 1-3 */}
        {STAGES.map((stage) => (
          <div
            key={stage.id}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              isStageComplete(stage.id)
                ? 'bg-terminal-green/20 text-terminal-green'
                : 'bg-gray-800 text-gray-500'
            }`}
          >
            <svg
              className="w-3 h-3"
              fill={isStageComplete(stage.id) ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isStageComplete(stage.id) ? (
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
        {flagsCount} / 3
      </span>
    </div>
  );
}
