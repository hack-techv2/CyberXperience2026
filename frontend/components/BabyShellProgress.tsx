'use client';

interface BabyShellProgressProps {
  currentStep: number;  // 0-10, 0 = not started, 10 = completed
  totalSteps?: number;
  viewingStep?: number;  // Which step instruction is being viewed (for review)
  onStepClick?: (stepNumber: number) => void;  // Callback when clicking a completed step
}

export default function BabyShellProgress({
  currentStep,
  totalSteps = 10,
  viewingStep,
  onStepClick
}: BabyShellProgressProps) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: totalSteps }, (_, i) => {
        const stepNum = i + 1;
        const isCompleted = stepNum <= currentStep;
        const isCurrent = stepNum === currentStep + 1;
        const isViewing = viewingStep === stepNum;
        // Allow clicking completed steps AND the current step (to return from review mode)
        const isClickable = (isCompleted || isCurrent) && onStepClick;

        return (
          <div
            key={stepNum}
            onClick={() => isClickable && onStepClick(stepNum)}
            className={`
              w-6 h-6 rounded flex items-center justify-center text-xs font-bold
              transition-all duration-200
              ${isViewing
                ? 'bg-terminal-cyan/30 text-terminal-cyan border-2 border-terminal-cyan ring-2 ring-terminal-cyan/30'
                : isCompleted
                  ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/50'
                  : isCurrent
                    ? 'bg-terminal-purple/20 text-terminal-purple border border-terminal-purple/50 animate-pulse'
                    : 'bg-gray-800 text-gray-600 border border-gray-700'
              }
              ${isClickable ? 'cursor-pointer hover:scale-110 hover:ring-2 hover:ring-terminal-green/50' : ''}
            `}
            title={
              isViewing
                ? `Viewing Step ${stepNum}`
                : isCompleted
                  ? `Step ${stepNum} completed - Click to review`
                  : isCurrent
                    ? `Current: Step ${stepNum} - Click to return from review`
                    : `Step ${stepNum}`
            }
          >
            {isCompleted ? (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              stepNum
            )}
          </div>
        );
      })}
    </div>
  );
}
