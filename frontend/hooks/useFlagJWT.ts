'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Cookies from 'js-cookie';
import { decodeJWT } from '@/lib/jwt';

const COOKIE_NAME = 'ctf_session';

export interface FoundCreds {
  username: string;
  password: string;
}

export interface UseFlagJWTResult {
  solvedStages: string[];
  flagsCount: number;
  foundCreds: FoundCreds | null;
  validateFlag: (potentialFlag: string) => Promise<boolean>;
  storeCredentials: (username: string, password: string) => Promise<boolean>;
  refreshFromCookie: () => void;
  isInitialized: boolean;
}

/**
 * React hook for JWT-based flag persistence with server-side validation
 *
 * - Requests JWT from server on first visit (server issues the token)
 * - Provides validateFlag to send candidates to server for validation
 * - Provides storeCredentials to save found credentials to JWT
 * - Provides refreshFromCookie to detect manual JWT modifications
 */
export function useFlagJWT(): UseFlagJWTResult {
  const [solvedStages, setSolvedStages] = useState<string[]>([]);
  const [flagsCount, setFlagsCount] = useState(0);
  const [foundCreds, setFoundCreds] = useState<FoundCreds | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const validatingRef = useRef<Set<string>>(new Set());
  const storingCredsRef = useRef(false);

  // Read state from the cookie and update state
  const refreshFromCookie = useCallback(() => {
    const token = Cookies.get(COOKIE_NAME);
    if (token) {
      const decoded = decodeJWT(token);
      if (decoded && decoded.payload) {
        const count = Math.min(Math.max(0, decoded.payload.flags_solved || 0), 3);
        const stages = Array.isArray(decoded.payload.solved_stages)
          ? decoded.payload.solved_stages
          : [];
        const creds = decoded.payload.found_creds || null;
        setSolvedStages(stages);
        setFlagsCount(count);
        setFoundCreds(creds);
      }
    }
  }, []);

  // Initialize JWT from server on mount
  useEffect(() => {
    const initSession = async () => {
      const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:4000';
      const existingToken = Cookies.get(COOKIE_NAME);

      try {
        const response = await fetch(`${gatewayUrl}/api/session/init`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            existingToken: existingToken || null,
          }),
        });

        if (response.ok) {
          const result = await response.json();

          // Store the token from server
          Cookies.set(COOKIE_NAME, result.token, {
            expires: 7, // 7 days
            sameSite: 'lax',
          });

          // Update state from payload
          const payload = result.payload;
          const count = Math.min(Math.max(0, payload.flags_solved || 0), 3);
          const stages = Array.isArray(payload.solved_stages)
            ? payload.solved_stages
            : [];
          const creds = payload.found_creds || null;

          setSolvedStages(stages);
          setFlagsCount(count);
          setFoundCreds(creds);
        } else {
          // Server error - fallback to reading existing cookie if available
          if (existingToken) {
            const decoded = decodeJWT(existingToken);
            if (decoded && decoded.payload) {
              const count = Math.min(Math.max(0, decoded.payload.flags_solved || 0), 3);
              const stages = Array.isArray(decoded.payload.solved_stages)
                ? decoded.payload.solved_stages
                : [];
              const creds = decoded.payload.found_creds || null;
              setSolvedStages(stages);
              setFlagsCount(count);
              setFoundCreds(creds);
            }
          }
        }
      } catch (error) {
        console.error('Session init error:', error);
        // Fallback to reading existing cookie
        if (existingToken) {
          const decoded = decodeJWT(existingToken);
          if (decoded && decoded.payload) {
            const count = Math.min(Math.max(0, decoded.payload.flags_solved || 0), 3);
            const stages = Array.isArray(decoded.payload.solved_stages)
              ? decoded.payload.solved_stages
              : [];
            const creds = decoded.payload.found_creds || null;
            setSolvedStages(stages);
            setFlagsCount(count);
            setFoundCreds(creds);
          }
        }
      }

      setIsInitialized(true);
    };

    initSession();
  }, []);

  // Validate a potential flag with the server
  const validateFlag = useCallback(async (potentialFlag: string): Promise<boolean> => {
    // Prevent duplicate validation requests for the same flag
    if (validatingRef.current.has(potentialFlag)) {
      return false;
    }

    validatingRef.current.add(potentialFlag);

    try {
      const sessionToken = Cookies.get(COOKIE_NAME);
      const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:4000';

      const response = await fetch(`${gatewayUrl}/api/validate-flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          potentialFlag,
          sessionToken,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();

      if (result.valid && result.newToken) {
        // Update cookie with new token
        Cookies.set(COOKIE_NAME, result.newToken, {
          expires: 7,
          sameSite: 'lax',
        });

        // Update state if this is a newly solved stage
        if (!result.alreadySolved) {
          setSolvedStages(prev => {
            if (prev.includes(result.stageId)) return prev;
            return [...prev, result.stageId];
          });
          setFlagsCount(result.flagsCount);
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Flag validation error:', error);
      return false;
    } finally {
      validatingRef.current.delete(potentialFlag);
    }
  }, []);

  // Store found credentials with the server
  const storeCredentials = useCallback(async (username: string, password: string): Promise<boolean> => {
    // Prevent duplicate store requests
    if (storingCredsRef.current) {
      return false;
    }

    // Already have credentials stored
    if (foundCreds) {
      return true;
    }

    storingCredsRef.current = true;

    try {
      const sessionToken = Cookies.get(COOKIE_NAME);
      const gatewayUrl = process.env.NEXT_PUBLIC_GATEWAY_URL || 'http://localhost:4000';

      const response = await fetch(`${gatewayUrl}/api/session/store-creds`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionToken,
          username,
          password,
        }),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();

      if (result.success && result.newToken) {
        // Update cookie with new token
        Cookies.set(COOKIE_NAME, result.newToken, {
          expires: 7,
          sameSite: 'lax',
        });

        // Update state
        if (!result.alreadyStored) {
          setFoundCreds({ username, password });
        }

        return true;
      }

      return false;
    } catch (error) {
      console.error('Store credentials error:', error);
      return false;
    } finally {
      storingCredsRef.current = false;
    }
  }, [foundCreds]);

  return {
    solvedStages,
    flagsCount,
    foundCreds,
    validateFlag,
    storeCredentials,
    refreshFromCookie,
    isInitialized,
  };
}
