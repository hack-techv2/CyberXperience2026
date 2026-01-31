/**
 * JWT utilities for CTF flag persistence
 *
 * INTENTIONALLY VULNERABLE: Uses "none" algorithm (no signature)
 * This allows users to decode, modify, and re-encode the JWT to "cheat"
 * 
 * Stores only the count of flags solved, not the actual flag values
 */

// JWT-safe base64 encoding (URL-safe, no padding)
export function base64UrlEncode(str: string): string {
  const base64 = btoa(str);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// JWT-safe base64 decoding
export function base64UrlDecode(str: string): string {
  // Add back padding if needed
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padding = base64.length % 4;
  if (padding) {
    base64 += '='.repeat(4 - padding);
  }
  return atob(base64);
}

export interface JWTPayload {
  flags_solved: number;
  iat: number;
  sub: string;
}

export interface DecodedJWT {
  header: { alg: string; typ: string };
  payload: JWTPayload;
}

/**
 * Create a JWT with "none" algorithm (intentionally vulnerable)
 */
export function createJWT(payload: JWTPayload): string {
  const header = { alg: 'none', typ: 'JWT' };

  const headerEncoded = base64UrlEncode(JSON.stringify(header));
  const payloadEncoded = base64UrlEncode(JSON.stringify(payload));

  // With "none" algorithm, signature is empty
  return `${headerEncoded}.${payloadEncoded}.`;
}

/**
 * Decode a JWT and accept "none" algorithm (intentionally vulnerable)
 * Returns null if the token is malformed
 */
export function decodeJWT(token: string): DecodedJWT | null {
  try {
    const parts = token.split('.');

    // JWT should have 3 parts (header.payload.signature)
    // With "none" algorithm, signature is empty
    if (parts.length < 2) {
      return null;
    }

    const header = JSON.parse(base64UrlDecode(parts[0]));
    const payload = JSON.parse(base64UrlDecode(parts[1]));

    // Accept "none" algorithm (this is the vulnerability!)
    // In a real app, you should NEVER accept "none" algorithm
    if (header.alg !== 'none') {
      // Still accept it for CTF purposes - users might try other algorithms
      console.warn('Non-standard algorithm detected, accepting anyway for CTF');
    }

    return { header, payload };
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
}

/**
 * Increment flag count in the JWT and return a new token
 */
export function addFlagToJWT(token: string): string | null {
  const decoded = decodeJWT(token);
  if (!decoded) {
    return null;
  }

  const currentCount = decoded.payload.flags_solved || 0;

  const newPayload: JWTPayload = {
    ...decoded.payload,
    flags_solved: currentCount + 1,
    iat: Math.floor(Date.now() / 1000),
  };

  return createJWT(newPayload);
}

/**
 * Create an initial JWT for a new visitor
 */
export function createInitialJWT(): string {
  const payload: JWTPayload = {
    flags_solved: 0,
    iat: Math.floor(Date.now() / 1000),
    sub: 'ctf_user',
  };

  return createJWT(payload);
}
