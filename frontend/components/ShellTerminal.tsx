'use client';

import { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import dynamic from 'next/dynamic';

// Dynamic import to prevent SSR issues with xterm.js (requires DOM)
const XTermComponent = dynamic(() => import('./XTermComponent'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 rounded-b bg-terminal-bg flex items-center justify-center min-h-0">
      <span className="text-gray-500">Loading terminal...</span>
    </div>
  ),
});

interface ShellTerminalProps {
  onFlagFound: (flag: string) => void;
}

export default function ShellTerminal({ onFlagFound }: ShellTerminalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  // Handle authentication
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setConnecting(true);

    try {
      const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:4000';
      const newSocket = io(gatewayUrl);

      newSocket.on('connect', () => {
        newSocket.emit('authenticate', { username, password });
      });

      newSocket.on('auth_success', () => {
        // Auth succeeded, wait for shell_ready
      });

      newSocket.on('auth_failed', (data) => {
        setError(data.message);
        setConnecting(false);
        newSocket.disconnect();
      });

      newSocket.on('shell_ready', () => {
        setAuthenticated(true);
        setConnecting(false);
      });

      newSocket.on('error', (data) => {
        setError(data.message);
        setConnecting(false);
      });

      newSocket.on('shell_closed', () => {
        setAuthenticated(false);
      });

      newSocket.on('disconnect', () => {
        setAuthenticated(false);
        setConnecting(false);
      });

      setSocket(newSocket);
    } catch (err) {
      setError('Failed to connect to gateway');
      setConnecting(false);
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    socket?.disconnect();
    setAuthenticated(false);
    setSocket(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  if (!authenticated) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-3 overflow-hidden">
        {/* Challenge Info */}
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded p-4 mb-4">
          <h2 className="text-terminal-yellow font-bold text-sm mb-2">Stage 2 & 3: Shell Access</h2>
          <p className="text-xs text-gray-400 mb-2">
            Use the credentials you discovered in Stage 1 to access the restricted shell.
            Once inside, find ways to escape the shell restrictions and escalate your privileges.
          </p>
          <div className="text-xs text-gray-600 space-y-1">
            <p><strong>Stage 2 Hint:</strong> The shell filters commands but what about shell operators?</p>
            <p><strong>Stage 3 Hint:</strong> Check what you can run with <code className="text-terminal-yellow">sudo -l</code></p>
          </div>
        </div>

        {/* Login Form */}
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded p-4">
          <h3 className="text-base font-bold mb-3 text-center">Shell Login</h3>

          {error && (
            <div className="mb-3 p-2 bg-terminal-red/20 border border-terminal-red rounded text-terminal-red text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full"
                disabled={connecting}
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full"
                disabled={connecting}
              />
            </div>

            <button
              type="submit"
              className="w-full btn-primary"
              disabled={connecting || !username || !password}
            >
              {connecting ? 'Connecting...' : 'Connect to Shell'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-3 overflow-hidden">
      {/* Terminal Header - macOS style window chrome */}
      <div className="bg-gray-800 rounded-t px-4 py-1.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-terminal-red"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-terminal-yellow"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-terminal-green"></div>
        </div>
        <span className="text-xs text-gray-400">Restricted Shell - {username}@shell-backend</span>
        <button
          onClick={handleDisconnect}
          className="text-xs text-gray-500 hover:text-terminal-red transition-colors"
        >
          Disconnect
        </button>
      </div>

      {/* Terminal Body - xterm.js component */}
      <XTermComponent socket={socket} onFlagFound={onFlagFound} />

      {/* Help Panel */}
      <div className="mt-2 bg-gray-900 border border-gray-800 rounded p-2 flex-shrink-0">
        <p className="text-xs text-gray-500">
          <strong>Commands:</strong> Type <code className="text-terminal-cyan">help</code> to see allowed commands.
          <span className="mx-2">|</span>
          <strong>Shortcuts:</strong> <code className="text-terminal-cyan">Ctrl+C</code> interrupt, <code className="text-terminal-cyan">Ctrl+L</code> clear
          <span className="mx-2">|</span>
          <strong>Flag 2:</strong> <code className="text-terminal-yellow">/home/ctf_user/flag2.txt</code>
          <span className="mx-2">|</span>
          <strong>Flag 3:</strong> <code className="text-terminal-red">/root/root_flag.txt</code>
        </p>
      </div>
    </div>
  );
}
