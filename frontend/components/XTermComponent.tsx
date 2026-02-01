'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { Socket } from 'socket.io-client';
import 'xterm/css/xterm.css';

interface XTermComponentProps {
  socket: Socket | null;
  onFlagCandidate: (flag: string) => void;
}

// JetBrains IDE-style terminal theme matching globals.css colors
const TERMINAL_THEME = {
  background: '#0d1117',
  foreground: '#c9d1d9',
  cursor: '#58a6ff',
  cursorAccent: '#0d1117',
  selectionBackground: '#264f78',
  selectionForeground: '#ffffff',
  black: '#0d1117',
  red: '#f85149',
  green: '#3fb950',
  yellow: '#d29922',
  blue: '#58a6ff',
  magenta: '#bc8cff',
  cyan: '#39c5cf',
  white: '#c9d1d9',
  brightBlack: '#484f58',
  brightRed: '#ff7b72',
  brightGreen: '#56d364',
  brightYellow: '#e3b341',
  brightBlue: '#79c0ff',
  brightMagenta: '#d2a8ff',
  brightCyan: '#56d4dd',
  brightWhite: '#f0f6fc',
};

const FLAG_REGEX = /FLAG\{[^}]+\}/g;

export default function XTermComponent({ socket, onFlagCandidate }: XTermComponentProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const isInitializedRef = useRef(false);

  // Flag detection callback - sends candidates to server for validation
  const checkForFlags = useCallback((text: string) => {
    const matches = text.match(FLAG_REGEX);
    if (matches) {
      matches.forEach(flag => onFlagCandidate(flag));
    }
  }, [onFlagCandidate]);

  // Initialize xterm.js terminal
  useEffect(() => {
    if (!terminalRef.current || isInitializedRef.current) return;

    const terminal = new Terminal({
      theme: TERMINAL_THEME,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', monospace",
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      allowProposedApi: true,
      convertEol: true,
      disableStdin: false,
      windowsMode: false,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();

    terminal.loadAddon(fitAddon);
    terminal.loadAddon(webLinksAddon);
    terminal.open(terminalRef.current);

    // Initial fit after a short delay to ensure DOM is ready
    setTimeout(() => {
      fitAddon.fit();
    }, 50);

    xtermRef.current = terminal;
    fitAddonRef.current = fitAddon;
    isInitializedRef.current = true;

    // Focus terminal on click
    terminalRef.current.addEventListener('click', () => {
      terminal.focus();
    });

    // Auto-focus on mount
    terminal.focus();

    return () => {
      terminal.dispose();
      isInitializedRef.current = false;
    };
  }, []);

  // Connect socket to terminal I/O
  useEffect(() => {
    if (!socket || !xtermRef.current) return;

    const terminal = xtermRef.current;

    // Send terminal input to server
    const inputDisposable = terminal.onData((data) => {
      socket.emit('input', data);
    });

    // Receive output from server and write to terminal
    const handleOutput = (data: string) => {
      terminal.write(data);
      checkForFlags(data);
    };
    socket.on('output', handleOutput);

    // Handle shell closed event
    const handleShellClosed = () => {
      terminal.write('\r\n\x1b[33m[Session ended]\x1b[0m\r\n');
    };
    socket.on('shell_closed', handleShellClosed);

    // Custom keyboard shortcuts
    terminal.attachCustomKeyEventHandler((event) => {
      // Ctrl+C - Send interrupt signal
      if (event.ctrlKey && event.key === 'c' && event.type === 'keydown') {
        socket.emit('input', '\x03');
        return false;
      }

      // Ctrl+L - Clear terminal screen
      if (event.ctrlKey && event.key === 'l' && event.type === 'keydown') {
        terminal.clear();
        socket.emit('input', '\x0c');
        return false;
      }

      // Ctrl+D - Send EOF
      if (event.ctrlKey && event.key === 'd' && event.type === 'keydown') {
        socket.emit('input', '\x04');
        return false;
      }

      // Allow all other keys
      return true;
    });

    return () => {
      inputDisposable.dispose();
      socket.off('output', handleOutput);
      socket.off('shell_closed', handleShellClosed);
    };
  }, [socket, checkForFlags]);

  // Handle terminal resize
  useEffect(() => {
    if (!socket || !fitAddonRef.current || !terminalRef.current || !xtermRef.current) return;

    const handleResize = () => {
      if (!fitAddonRef.current || !xtermRef.current) return;

      fitAddonRef.current.fit();

      // Send new dimensions to server for PTY resize
      socket.emit('resize', {
        cols: xtermRef.current.cols,
        rows: xtermRef.current.rows,
      });
    };

    // Debounce resize for performance
    let resizeTimeout: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 100);
    };

    // Use ResizeObserver for container size changes
    const resizeObserver = new ResizeObserver(debouncedResize);
    resizeObserver.observe(terminalRef.current);

    // Also listen to window resize
    window.addEventListener('resize', debouncedResize);

    // Initial resize after socket connects
    setTimeout(handleResize, 100);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(resizeTimeout);
    };
  }, [socket]);

  return (
    <div
      ref={terminalRef}
      className="flex-1 rounded-b overflow-hidden xterm-container min-h-0"
      style={{
        backgroundColor: TERMINAL_THEME.background,
      }}
    />
  );
}
