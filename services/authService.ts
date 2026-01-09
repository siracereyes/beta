
import { UserSession } from "../types";

/**
 * The endpoint on Vercel that handles the database query.
 */
const VERCEL_API_ENDPOINT = "/api/auth/login";

export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates login against the real Vercel Postgres database via an API route.
 */
export async function validateLogin(username: string, passwordPlain: string): Promise<UserSession | null> {
  try {
    const response = await fetch(VERCEL_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: passwordPlain }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Auth API Error:", errorData.error);
      return null;
    }

    const data = await response.json();
    
    // Return the session object provided by the backend
    return {
      username: data.username,
      sdo: data.sdo,
      schoolName: data.schoolName,
      email: data.email
    };
  } catch (error) {
    console.error("Network error connecting to Vercel Database:", error);
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
