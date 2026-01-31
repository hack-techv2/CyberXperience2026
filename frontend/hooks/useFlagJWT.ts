'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';
import { createInitialJWT, decodeJWT, addFlagToJWT } from '@/lib/jwt';

const COOKIE_NAME = 'ctf_session';

// Placeholder flags with the patterns FlagTracker looks for
const PLACEHOLDER_FLAGS = [
  'FLAG{p4th_tr4v3rs4l_placeholder}',
  'FLAG{c0mm4nd_1nj3ct10n_placeholder}',
  'FLAG{gtf0_f1nd_placeholder}',
];

export interface UseFlagJWTResult {
  flags: string[];
  addFlag: (flag: string) => void;
  refreshFromCookie: () => void;
  isInitialized: boolean;
}

/**
 * React hook for JWT-based flag persistence
 *
 * - Initializes JWT cookie on first visit
 * - Provides addFlag to capture flags
 * - Provides refreshFromCookie to detect manual JWT modifications
 */
export function useFlagJWT(): UseFlagJWTResult {
  const [flags, setFlags] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  // Track flags added legitimately (not from JWT cheating)
  const legitimateFlags = useRef<string[]>([]);

  // Generate flags array based on JWT count (for cheating detection)
  const generateFlagsFromCount = useCallback((count: number): string[] => {
    // Combine legitimate flags with placeholders to reach the count
    const result = [...legitimateFlags.current];
    const neededPlaceholders = count - result.length;

    if (neededPlaceholders > 0) {
      // Add placeholder flags for stages not legitimately solved
      for (let i = 0; i < neededPlaceholders && i < PLACEHOLDER_FLAGS.length; i++) {
        // Find a placeholder that isn't already matched by legitimate flags
        const placeholder = PLACEHOLDER_FLAGS[i];
        const pattern = placeholder.match(/FLAG\{(\w+)_placeholder\}/)?.[1];
        const alreadyHasPattern = result.some(f => pattern && f.includes(pattern));
        if (!alreadyHasPattern) {
          result.push(placeholder);
        }
      }
    }

    return result.slice(0, 3); // Max 3 flags
  }, []);

  // Read flags_solved from the cookie and update state
  const refreshFromCookie = useCallback(() => {
    const token = Cookies.get(COOKIE_NAME);
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded && typeof decoded.payload.flags_solved === 'number') {
        const count = Math.min(Math.max(0, decoded.payload.flags_solved), 3);
        const newFlags = generateFlagsFromCount(count);
        setFlags(newFlags);
      }
    }
  }, [generateFlagsFromCount]);

  // Initialize JWT cookie on mount
  useEffect(() => {
    const existingToken = Cookies.get(COOKIE_NAME);

    if (!existingToken) {
      // First visit - create initial JWT
      const newToken = createInitialJWT();
      Cookies.set(COOKIE_NAME, newToken, {
        expires: 7, // 7 days
        sameSite: 'lax',
      });
      setFlags([]);
    } else {
      // Existing visit - read flags_solved from JWT
      const decoded = decodeJWT(existingToken);
      if (decoded && typeof decoded.payload.flags_solved === 'number') {
        const count = Math.min(Math.max(0, decoded.payload.flags_solved), 3);
        const restoredFlags = generateFlagsFromCount(count);
        setFlags(restoredFlags);
      } else {
        setFlags([]);
      }
    }

    setIsInitialized(true);
  }, [generateFlagsFromCount]);

  // Add a flag to the JWT (legitimate flag capture)
  const addFlag = useCallback((flag: string) => {
    // Check if this flag was already legitimately captured
    if (legitimateFlags.current.includes(flag)) {
      return; // Don't increment if already captured
    }

    // Check if we already have a flag with the same pattern
    const patterns = ['p4th_tr4v3rs4l', 'c0mm4nd_1nj3ct10n', 'gtf0_f1nd'];
    const flagPattern = patterns.find(p => flag.includes(p));
    if (flagPattern && legitimateFlags.current.some(f => f.includes(flagPattern))) {
      return; // Already have a flag for this stage
    }

    const token = Cookies.get(COOKIE_NAME);
    if (!token) {
      // No token exists, create one and increment
      const newToken = createInitialJWT();
      const updatedToken = addFlagToJWT(newToken);
      if (updatedToken) {
        Cookies.set(COOKIE_NAME, updatedToken, {
          expires: 7,
          sameSite: 'lax',
        });
        legitimateFlags.current = [flag];
        setFlags([flag]);
      }
      return;
    }

    const updatedToken = addFlagToJWT(token);
    if (updatedToken) {
      Cookies.set(COOKIE_NAME, updatedToken, {
        expires: 7,
        sameSite: 'lax',
      });

      // Track as legitimate flag and update state
      legitimateFlags.current = [...legitimateFlags.current, flag];
      setFlags((prev) => {
        // Remove any placeholder for this pattern and add the real flag
        const filtered = prev.filter(f => {
          if (!flagPattern) return true;
          return !f.includes(flagPattern) || f === flag;
        });
        if (!filtered.includes(flag)) {
          filtered.push(flag);
        }
        return filtered;
      });
    }
  }, []);

  return {
    flags,
    addFlag,
    refreshFromCookie,
    isInitialized,
  };
}
