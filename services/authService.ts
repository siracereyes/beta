
import { UserSession } from "../types";

/**
 * Hashes a string using SHA-256 for secure comparison.
 */
export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates login via serverless API route.
 * Communicates with Vercel Postgres.
 */
export async function validateLogin(username: string, passwordPlain: string): Promise<UserSession | null> {
  try {
    const hashedPassword = await hashPassword(passwordPlain);
    
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username,
        passwordHash: hashedPassword
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.warn("Auth Failed:", errorData.error);
      return null;
    }

    const session: UserSession = await response.json();
    return session;
  } catch (error) {
    console.error("Authentication Request Failed:", error);
    return null;
  }
}

export function saveSession(session: UserSession) {
  localStorage.setItem('ftad_session', JSON.stringify(session));
}

export function getSession(): UserSession | null {
  const raw = localStorage.getItem('ftad_session');
  try {
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem('ftad_session');
}
