'use client';

import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import dynamic from 'next/dynamic';
import type { FoundCreds } from '@/hooks/useFlagJWT';

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
  onFlagCandidate: (flag: string) => void;
  foundCreds: FoundCreds | null;
}

export default function ShellTerminal({ onFlagCandidate, foundCreds }: ShellTerminalProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [initialOutput, setInitialOutput] = useState<string>('');

  // Connect to shell with given credentials
  const connectWithCreds = useCallback(async (username: string, password: string) => {
    if (connecting || authenticated) return;

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

      newSocket.on('shell_ready', (data) => {
        setAuthenticated(true);
        setConnecting(false);
        if (data?.initialOutput) {
          setInitialOutput(data.initialOutput);
        }
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
  }, [connecting, authenticated]);

  // Handle connect button click
  const handleConnect = () => {
    if (foundCreds) {
      connectWithCreds(foundCreds.username, foundCreds.password);
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

  // Show "complete stage 1" message if no credentials found
  if (!foundCreds) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-3 overflow-hidden">
        {/* Challenge Info */}
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded p-4 mb-4">
          <h2 className="text-terminal-yellow font-bold text-sm mb-2">Stage 2 & 3: Shell Access</h2>
          <p className="text-xs text-gray-400 mb-2">
            Once you have discovered the credentials, you will be able to access the restricted shell.
            Find ways to escape the shell restrictions and escalate your privileges.
          </p>
        </div>

        {/* Locked State */}
        <div className="max-w-md w-full bg-gray-900 border border-terminal-red/50 rounded p-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <svg className="w-8 h-8 text-terminal-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="text-base font-bold text-terminal-red">Shell Access Locked</h3>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400 mb-2">
              You must complete <span className="text-terminal-cyan font-bold">Stage 1</span> first.
            </p>
            <p className="text-xs text-gray-500">
              Discover the shell credentials by exploiting the path traversal vulnerability in the Web Explorer tab.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
        </div>

        {/* Credentials Found - Ready to Connect */}
        <div className="max-w-md w-full bg-gray-900 border border-terminal-green/50 rounded p-4">
          <div className="flex items-center justify-center gap-3 mb-3">
            <svg className="w-8 h-8 text-terminal-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
            <h3 className="text-base font-bold text-terminal-green">Credentials Discovered!</h3>
          </div>

          <div className="bg-gray-800 rounded p-3 mb-4 font-mono text-sm">
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-400">Username:</span>
              <span className="text-terminal-cyan">{foundCreds.username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Password:</span>
              <span className="text-terminal-cyan">{foundCreds.password}</span>
            </div>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-terminal-red/20 border border-terminal-red rounded text-terminal-red text-xs">
              {error}
            </div>
          )}

          <button
            onClick={handleConnect}
            className="w-full btn-primary"
            disabled={connecting}
          >
            {connecting ? 'Connecting...' : 'Connect to Shell'}
          </button>
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
        <span className="text-xs text-gray-400">Restricted Shell - {foundCreds.username}@shell-backend</span>
        <button
          onClick={handleDisconnect}
          className="text-xs text-gray-500 hover:text-terminal-red transition-colors"
        >
          Disconnect
        </button>
      </div>

      {/* Terminal Body - xterm.js component */}
      <XTermComponent socket={socket} onFlagCandidate={onFlagCandidate} initialOutput={initialOutput} />

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
