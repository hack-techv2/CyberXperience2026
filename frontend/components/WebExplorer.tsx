'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface WebExplorerProps {
  onFlagFound: (flag: string) => void;
}

interface HistoryEntry {
  command: string;
  output: string;
  isError?: boolean;
}

// Simulated file system structure (what users think exists)
const VIRTUAL_FILES: Record<string, string[]> = {
  '/': ['public'],
  '/public': ['readme.txt', 'contact.txt', 'terms.txt'],
};

// Help text for available commands
const HELP_TEXT = `Available commands:
  help              Show this help message
  ls [path]         List directory contents
  cat <file>        Display file contents
  pwd               Print working directory
  cd <path>         Change directory
  clear             Clear the terminal
  whoami            Display current user
  id                Display user identity

Hint: The server's file API might not properly validate paths...`;

const BANNER = `
╔═══════════════════════════════════════════════════════════════╗
║                    Document Retrieval System                   ║
║                         Version 1.0.3                          ║
╠═══════════════════════════════════════════════════════════════╣
║  Welcome to the secure document server.                        ║
║  Type 'help' for available commands.                           ║
╚═══════════════════════════════════════════════════════════════╝
`;

export default function WebExplorer({ onFlagFound }: WebExplorerProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentPath, setCurrentPath] = useState('/public');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  const apiBase = '/api/web';

  // Check for flags in content
  const checkForFlags = useCallback((content: string) => {
    const flagMatch = content.match(/FLAG\{[^}]+\}/g);
    if (flagMatch) {
      flagMatch.forEach(flag => onFlagFound(flag));
    }
  }, [onFlagFound]);

  // Fetch file from the vulnerable API
  const fetchFile = async (filename: string): Promise<{ output: string; isError: boolean }> => {
    try {
      // Use query parameter to pass filename - avoids URL path normalization issues
      // The ../ sequences are preserved in query params, enabling the path traversal attack
      const res = await fetch(`${apiBase}/files/read?name=${encodeURIComponent(filename)}`);
      const data = await res.json();

      if (data.status === 'success' && data.content) {
        checkForFlags(data.content);
        return { output: data.content, isError: false };
      } else {
        return { output: data.message || 'File not found', isError: true };
      }
    } catch {
      return { output: 'Error: Failed to connect to server', isError: true };
    }
  };

  // List files from API
  const listFiles = async (): Promise<{ output: string; isError: boolean }> => {
    try {
      const res = await fetch(`${apiBase}/files`);
      const data = await res.json();

      if (data.status === 'success' && data.files) {
        return { output: data.files.join('  '), isError: false };
      } else {
        return { output: data.message || 'Cannot list directory', isError: true };
      }
    } catch {
      return { output: 'Error: Failed to connect to server', isError: true };
    }
  };

  // Process commands
  const processCommand = async (input: string): Promise<{ output: string; isError?: boolean }> => {
    const trimmed = input.trim();
    if (!trimmed) return { output: '' };

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    switch (cmd) {
      case 'help':
        return { output: HELP_TEXT };

      case 'clear':
        setHistory([]);
        return { output: '' };

      case 'pwd':
        return { output: currentPath };

      case 'whoami':
        return { output: 'guest' };

      case 'id':
        return { output: 'uid=1000(guest) gid=1000(guest) groups=1000(guest)' };

      case 'ls': {
        const targetPath = args[0] || currentPath;

        // Check if it's a path traversal attempt
        if (targetPath.includes('..')) {
          return { output: `ls: cannot access '${targetPath}': Permission denied`, isError: true };
        }

        // List from API for /public
        if (targetPath === '/public' || targetPath === '.' || targetPath === '') {
          const result = await listFiles();
          return result;
        }

        // Check virtual filesystem
        const files = VIRTUAL_FILES[targetPath];
        if (files) {
          return { output: files.join('  ') };
        }

        return { output: `ls: cannot access '${targetPath}': No such file or directory`, isError: true };
      }

      case 'cd': {
        const targetPath = args[0];
        if (!targetPath || targetPath === '~' || targetPath === '/public') {
          setCurrentPath('/public');
          return { output: '' };
        }

        if (targetPath === '..') {
          if (currentPath === '/public') {
            setCurrentPath('/');
            return { output: '' };
          }
          return { output: '' };
        }

        if (targetPath === '/') {
          setCurrentPath('/');
          return { output: '' };
        }

        // Block obvious traversal in cd (they need to use cat for the exploit)
        if (targetPath.includes('..') && targetPath.includes('data')) {
          return { output: `cd: ${targetPath}: Permission denied`, isError: true };
        }

        if (VIRTUAL_FILES[targetPath]) {
          setCurrentPath(targetPath);
          return { output: '' };
        }

        return { output: `cd: ${targetPath}: No such file or directory`, isError: true };
      }

      case 'cat': {
        if (args.length === 0) {
          return { output: 'cat: missing operand', isError: true };
        }

        const filename = args.join(' ');

        // This is where the vulnerability lies - we pass the filename directly to the API
        // The API doesn't sanitize paths, allowing directory traversal
        const result = await fetchFile(filename);
        return result;
      }

      case 'echo':
        return { output: args.join(' ') };

      case 'date':
        return { output: new Date().toString() };

      case 'uname':
        if (args[0] === '-a') {
          return { output: 'Linux docserver 5.15.0-generic #1 SMP x86_64 GNU/Linux' };
        }
        return { output: 'Linux' };

      case 'hostname':
        return { output: 'docserver' };

      case 'env':
        return { output: 'PATH=/usr/local/bin:/usr/bin:/bin\nHOME=/home/guest\nUSER=guest\nSHELL=/bin/rbash' };

      case 'history':
        return { output: commandHistory.map((c, i) => `  ${i + 1}  ${c}`).join('\n') };

      case 'sudo':
        return { output: 'guest is not in the sudoers file. This incident will be reported.', isError: true };

      case 'rm':
      case 'mv':
      case 'cp':
      case 'mkdir':
      case 'touch':
      case 'chmod':
      case 'chown':
        return { output: `${cmd}: Operation not permitted`, isError: true };

      case 'wget':
      case 'curl':
        return { output: `${cmd}: command not found`, isError: true };

      case 'exit':
      case 'logout':
        return { output: 'Logout not permitted in web shell.' };

      default:
        return { output: `${cmd}: command not found`, isError: true };
    }
  };

  // Handle command submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentInput.trim()) {
      setHistory(prev => [...prev, { command: '', output: '' }]);
      return;
    }

    const input = currentInput;
    setCurrentInput('');
    setCommandHistory(prev => [...prev, input]);
    setHistoryIndex(-1);

    const result = await processCommand(input);

    if (input.toLowerCase().trim() !== 'clear') {
      setHistory(prev => [...prev, { command: input, output: result.output, isError: result.isError }]);
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
      // Simple tab completion for common commands
      const commands = ['help', 'ls', 'cat', 'pwd', 'cd', 'clear', 'whoami', 'id', 'echo', 'history'];
      const match = commands.find(c => c.startsWith(currentInput.toLowerCase()));
      if (match) {
        setCurrentInput(match + ' ');
      }
    }
  };

  // Focus input when clicking terminal
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
    setHistory([{ command: '', output: BANNER }]);
  }, []);

  // Get prompt string
  const getPrompt = () => {
    const path = currentPath === '/public' ? '~' : currentPath;
    return `guest@docserver:${path}$ `;
  };

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden">
      {/* Challenge Info */}
      <div className="bg-gray-900 border border-gray-800 rounded p-3 mb-2 flex-shrink-0">
        <h2 className="text-terminal-cyan font-bold text-sm mb-1">Stage 1: Information Disclosure</h2>
        <p className="text-xs text-gray-400 mb-1">
          You have shell access to a document server. The server has a file retrieval system
          that allows reading files from the public directory. Can you find a way to read files
          outside of the intended directory?
        </p>
        <div className="text-xs text-gray-600">
          <strong>Objective:</strong> Find and read <code className="text-terminal-yellow">/data/secrets/credentials.txt</code>
        </div>
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
          <span className="text-xs text-gray-400 ml-4">guest@docserver — /bin/rbash</span>
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
                  <span className="text-terminal-green">{getPrompt()}</span>
                  <span className="text-terminal-fg">{entry.command}</span>
                </div>
              )}
              {entry.output && (
                <pre className={`whitespace-pre-wrap ${entry.isError ? 'text-terminal-red' : 'text-terminal-fg'}`}>
                  {entry.output}
                </pre>
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
        <p className="text-xs text-gray-500">
          <strong>Tips:</strong> Use <code className="text-terminal-cyan">ls</code> to list files,{' '}
          <code className="text-terminal-cyan">cat &lt;file&gt;</code> to read files,{' '}
          <code className="text-terminal-cyan">help</code> for all commands.
          <span className="mx-2">|</span>
          <strong>Navigation:</strong> ↑/↓ for command history, Tab for completion
        </p>
      </div>
    </div>
  );
}
