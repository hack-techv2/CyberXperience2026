'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { BABY_SHELL_STEPS, matchesStepCommand } from '@/config/babyShellSteps';
import BabyShellProgress from './BabyShellProgress';

interface BabyShellProps {
  currentStep: number;
  onStepComplete: (stepNumber: number) => Promise<boolean>;
  isCompleted: boolean;
}

interface HistoryEntry {
  command: string;
  output: string;
  prompt: string;  // Capture prompt at execution time (before cd changes path)
  isError?: boolean;
  isSuccess?: boolean;
  successMessage?: string;  // Store the message at time of completion
}

// Virtual filesystem for Baby Shell (simpler than WebExplorer)
const VIRTUAL_FS: Record<string, { type: 'dir' | 'file'; children?: string[]; content?: string }> = {
  '/': { type: 'dir', children: ['home'] },
  '/home': { type: 'dir', children: ['student'] },
  '/home/student': { type: 'dir', children: ['welcome.txt', 'notes.txt', 'documents'] },
  '/home/student/welcome.txt': {
    type: 'file',
    content: `Welcome to the Baby Shell Tutorial!

This is a safe environment to learn terminal basics.
Don't worry - you can't break anything here!

Try using 'ls' to see what other files are available.
`,
  },
  '/home/student/notes.txt': {
    type: 'file',
    content: `Quick Reference:
- pwd    : Print where you are
- ls     : List files
- cd     : Change directory
- cat    : Read a file
- clear  : Clean the screen
- help   : Show all commands
`,
  },
  '/home/student/documents': { type: 'dir', children: ['readme.md', 'tutorial.txt'] },
  '/home/student/documents/readme.md': {
    type: 'file',
    content: `# Documents Folder

You found the documents folder!
This is where files can be organized into subdirectories.

Navigation tip: Use 'cd ..' to go back up.
`,
  },
  '/home/student/documents/tutorial.txt': {
    type: 'file',
    content: `Tutorial Complete!

If you're reading this, you've learned how to:
1. Navigate directories with cd
2. List files with ls
3. Read files with cat

You're ready for the real challenges!
`,
  },
  // ASG directory for absolute path exercise
  '/home/ASG': { type: 'dir', children: ['documents'] },
  '/home/ASG/documents': { type: 'dir', children: ['secret.txt'] },
  '/home/ASG/documents/secret.txt': {
    type: 'file',
    content: `Congratulations!

You've mastered absolute paths!
Absolute paths start with / and specify the full location from root.
This is useful when you need to navigate directly to any location.
`,
  },
};

const HELP_TEXT = `Available commands:
  help              Show this help message
  ls [path]         List directory contents
  cat <file>        Display file contents
  pwd               Print working directory
  cd <path>         Change directory
  clear             Clear the terminal
  whoami            Display current user
  echo <text>       Print text to screen`;

const BANNER = `
 ____        _           ____  _          _ _
| __ )  __ _| |__  _   _/ ___|| |__   ___| | |
|  _ \\ / _\` | '_ \\| | | \\___ \\| '_ \\ / _ \\ | |
| |_) | (_| | |_) | |_| |___) | | | |  __/ | |
|____/ \\__,_|_.__/ \\__, |____/|_| |_|\\___|_|_|
                   |___/

Welcome to Baby Shell - Your First Terminal!
Follow the instructions below to complete each step.
Type 'help' anytime to see available commands.
`;

export default function BabyShell({ currentStep, onStepComplete, isCompleted }: BabyShellProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentPath, setCurrentPath] = useState('/home/student');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showHint, setShowHint] = useState(false);
  const [viewingStep, setViewingStep] = useState<number | null>(null);  // For reviewing past steps
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Get current step info - show viewing step if reviewing, otherwise show actual progress
  const displayStep = viewingStep !== null ? viewingStep : currentStep + 1;
  const activeStep = BABY_SHELL_STEPS[currentStep] || null;
  const displayedStep = viewingStep !== null ? BABY_SHELL_STEPS[viewingStep - 1] : activeStep;
  const isReviewingPastStep = viewingStep !== null && viewingStep <= currentStep;

  // Normalize path (resolve . and ..)
  const normalizePath = (path: string): string => {
    if (!path) return '/';
    const absolutePath = path.startsWith('/') ? path : '/' + path;
    const segments = absolutePath.split('/').filter((s) => s !== '' && s !== '.');
    const result: string[] = [];
    for (const segment of segments) {
      if (segment === '..') {
        if (result.length > 0) result.pop();
      } else {
        result.push(segment);
      }
    }
    return '/' + result.join('/');
  };

  // Resolve path relative to current directory
  const resolvePath = (targetPath: string): string => {
    if (targetPath === '~') return '/home/student';
    if (targetPath.startsWith('/')) return normalizePath(targetPath);
    if (targetPath.startsWith('~')) return normalizePath('/home/student' + targetPath.slice(1));
    return normalizePath(currentPath + '/' + targetPath);
  };

  // Process command
  const processCommand = useCallback(
    async (input: string): Promise<{ output: string; isError?: boolean; isSuccess?: boolean }> => {
      const trimmed = input.trim();
      if (!trimmed) return { output: '' };

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      // Check if this command completes the current step
      let stepCompleted = false;
      if (activeStep && matchesStepCommand(activeStep, trimmed)) {
        stepCompleted = true;
      }

      let result: { output: string; isError?: boolean; isSuccess?: boolean };

      switch (cmd) {
        case 'help':
          result = { output: HELP_TEXT };
          break;

        case 'clear':
          setHistory([]);
          result = { output: '' };
          break;

        case 'pwd':
          result = { output: currentPath };
          break;

        case 'whoami':
          result = { output: 'student' };
          break;

        case 'echo':
          result = { output: args.join(' ') };
          break;

        case 'ls': {
          const targetPath = args[0] ? resolvePath(args[0]) : currentPath;
          const node = VIRTUAL_FS[targetPath];

          if (!node) {
            result = { output: `ls: cannot access '${args[0] || '.'}': No such file or directory`, isError: true };
          } else if (node.type === 'file') {
            result = { output: args[0] || targetPath.split('/').pop() || '' };
          } else {
            result = { output: node.children?.join('  ') || '' };
          }
          break;
        }

        case 'cd': {
          const targetArg = args[0];
          if (!targetArg || targetArg === '~') {
            setCurrentPath('/home/student');
            result = { output: '' };
            break;
          }

          const resolvedPath = resolvePath(targetArg);
          const node = VIRTUAL_FS[resolvedPath];

          if (!node) {
            result = { output: `cd: ${targetArg}: No such file or directory`, isError: true };
          } else if (node.type === 'file') {
            result = { output: `cd: ${targetArg}: Not a directory`, isError: true };
          } else {
            setCurrentPath(resolvedPath);
            result = { output: '' };
          }
          break;
        }

        case 'cat': {
          if (args.length === 0) {
            result = { output: 'cat: missing operand', isError: true };
            break;
          }

          const filePath = resolvePath(args[0]);
          const node = VIRTUAL_FS[filePath];

          if (!node) {
            result = { output: `cat: ${args[0]}: No such file or directory`, isError: true };
          } else if (node.type === 'dir') {
            result = { output: `cat: ${args[0]}: Is a directory`, isError: true };
          } else {
            result = { output: node.content || '' };
          }
          break;
        }

        default:
          result = { output: `${cmd}: command not found`, isError: true };
      }

      // If step was completed, add success indicator and trigger callback
      if (stepCompleted && !result.isError) {
        result.isSuccess = true;
        (result as { successMessage?: string }).successMessage = activeStep!.successMessage;  // Capture message now
        // Trigger the step completion
        setTimeout(() => {
          onStepComplete(activeStep!.id);
        }, 100);
      }

      return result;
    },
    [currentPath, activeStep, onStepComplete, resolvePath]
  );

  // Handle command submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Capture prompt BEFORE processing command (before cd changes currentPath)
    const capturedPrompt = getPrompt();

    if (!currentInput.trim()) {
      setHistory((prev) => [...prev, { command: '', output: '', prompt: capturedPrompt }]);
      return;
    }

    const input = currentInput;
    setCurrentInput('');
    setCommandHistory((prev) => [...prev, input]);
    setHistoryIndex(-1);
    setShowHint(false);

    // Users stay in review mode when entering commands - they can click progress dots to navigate

    const result = await processCommand(input);

    if (input.toLowerCase().trim() !== 'clear') {
      setHistory((prev) => [...prev, {
        command: input,
        output: result.output,
        prompt: capturedPrompt,  // Use captured prompt, not current
        isError: result.isError,
        isSuccess: result.isSuccess,
        successMessage: (result as { successMessage?: string }).successMessage
      }]);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex] || '');
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const commands = ['help', 'ls', 'cat', 'pwd', 'cd', 'clear', 'whoami', 'echo'];
      const match = commands.find((c) => c.startsWith(currentInput.toLowerCase()));
      if (match) {
        setCurrentInput(match + ' ');
      }
    }
  };

  // Focus input
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // Scroll to bottom on new output
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [history]);

  // Show banner on mount
  useEffect(() => {
    setHistory([{ command: '', output: BANNER, prompt: '' }]);
  }, []);

  // Get prompt
  const getPrompt = () => {
    const displayPath = currentPath === '/home/student' ? '~' : currentPath;
    return `student@babyshell:${displayPath}$ `;
  };

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden">
      {/* Challenge Info */}
      <div className="bg-gray-900 border border-gray-800 rounded p-3 mb-2 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-terminal-purple font-bold text-sm">Stage 0: Baby Shell Tutorial</h2>
          <BabyShellProgress
            currentStep={currentStep}
            viewingStep={viewingStep ?? undefined}
            onStepClick={(stepNum) => {
              if (stepNum <= currentStep) {
                // Click completed step to review it
                setViewingStep(stepNum);
                setShowHint(false);
              } else if (stepNum === currentStep + 1) {
                // Click current step to return from review mode
                setViewingStep(null);
                setShowHint(false);
              }
            }}
          />
        </div>

        {isCompleted ? (
          <div className="text-terminal-green text-sm">
            <span className="mr-2">🎉</span>
            <strong>Tutorial Complete!</strong> You&apos;ve mastered the basics. Ready for the real challenges!
          </div>
        ) : isReviewingPastStep && displayedStep ? (
          <div className="bg-terminal-cyan/10 border border-terminal-cyan/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="bg-terminal-cyan text-white text-xs font-bold px-2 py-0.5 rounded">
                  Reviewing Step {displayedStep.id}
                </span>
                <span className="text-terminal-cyan font-semibold">{displayedStep.title}</span>
              </div>
              <button
                onClick={() => setViewingStep(null)}
                className="text-xs bg-terminal-purple/20 text-terminal-purple px-2 py-1 rounded hover:bg-terminal-purple/30 transition-colors"
              >
                ← Back to Step {currentStep + 1}
              </button>
            </div>
            <p className="text-gray-300 text-sm mb-2">{displayedStep.instruction}</p>
            <div className="flex items-center gap-2 bg-gray-800/50 rounded px-3 py-2">
              <span className="text-gray-400 text-xs">Command was:</span>
              <code className="text-terminal-cyan font-bold text-base">{displayedStep.expectedCommand}</code>
            </div>
            <p className="text-xs text-gray-500 mt-2 italic">
              You can re-type commands to practice, but progress is saved at Step {currentStep + 1}.
            </p>
          </div>
        ) : activeStep ? (
          <div className="bg-terminal-purple/10 border border-terminal-purple/30 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-terminal-purple text-white text-xs font-bold px-2 py-0.5 rounded">
                Step {activeStep.id} of 10
              </span>
              <span className="text-terminal-purple font-semibold">{activeStep.title}</span>
            </div>
            <p className="text-gray-300 text-sm mb-2">{activeStep.instruction}</p>
            <div className="flex items-center gap-2 bg-gray-800/50 rounded px-3 py-2">
              <span className="text-gray-400 text-xs">Type:</span>
              <code className="text-terminal-cyan font-bold text-base">{activeStep.expectedCommand}</code>
            </div>
          </div>
        ) : null}
      </div>

      {/* Terminal Window */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Terminal Header - macOS style */}
        <div className="bg-gray-800 rounded-t px-4 py-1.5 flex items-center flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-terminal-red"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-terminal-green"></div>
          </div>
          <span className="text-xs text-gray-400 ml-4">student@babyshell — bash</span>
        </div>

        {/* Terminal Body */}
        <div
          ref={terminalRef}
          onClick={focusInput}
          className="flex-1 bg-terminal-bg rounded-b p-3 font-mono text-sm overflow-y-auto cursor-text"
        >
          {/* Command History */}
          {history.map((entry, index) => (
            <div key={index} className="mb-1">
              {entry.command && (
                <div className="flex">
                  <span className="text-terminal-green">{entry.prompt || getPrompt()}</span>
                  <span className="text-terminal-fg">{entry.command}</span>
                </div>
              )}
              {entry.output && (
                <pre
                  className={`whitespace-pre-wrap ${
                    entry.isError ? 'text-terminal-red' : entry.isSuccess ? 'text-terminal-green' : 'text-terminal-fg'
                  }`}
                >
                  {entry.output}
                </pre>
              )}
              {entry.isSuccess && entry.successMessage && (
                <div className="text-terminal-green text-sm mt-1 mb-2 px-2 py-1 bg-terminal-green/10 rounded border border-terminal-green/30">
                  <span className="mr-1">✓</span>
                  {entry.successMessage}
                </div>
              )}
            </div>
          ))}

          {/* Current Input Line */}
          <form onSubmit={handleSubmit} className="flex">
            <span className="text-terminal-green">{getPrompt()}</span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="terminal-input flex-1 text-terminal-fg caret-terminal-green"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
            />
          </form>
        </div>
      </div>

      {/* Help Panel */}
      <div className="mt-2 bg-gray-900 border border-gray-800 rounded p-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            <strong>Tips:</strong> Use <code className="text-terminal-cyan">↑/↓</code> for command history,{' '}
            <code className="text-terminal-cyan">Tab</code> for autocomplete
          </p>
          {activeStep && !isCompleted && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="text-xs text-terminal-yellow hover:text-terminal-yellow/80 transition-colors"
            >
              {showHint ? 'Hide Hint' : 'Need a Hint?'}
            </button>
          )}
        </div>
        {showHint && activeStep && (
          <p className="text-xs text-terminal-yellow mt-2 pt-2 border-t border-gray-800">
            <strong>Hint:</strong> {activeStep.hint}
          </p>
        )}
      </div>
    </div>
  );
}
