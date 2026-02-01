/**
 * JWT utilities for CTF flag persistence
 *
 * INTENTIONALLY VULNERABLE: Uses "none" algorithm (no signature)
 * This allows users to decode, modify, and re-encode the JWT to "cheat"
 *
 * JWT issuance is now server-side. This file only contains decoding utilities.
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

export interface FoundCreds {
  username: string;
  password: string;
}

export interface JWTPayload {
  flags_solved: number;
  solved_stages?: string[];
  found_creds?: FoundCreds | null;
  iat: number;
  sub: string;
}

export interface DecodedJWT {
  header: { alg: string; typ: string };
  payload: JWTPayload;
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
