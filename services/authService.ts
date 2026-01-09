
import { Account, UserSession } from "../types";

/**
 * Hashes a string using SHA-256 for secure comparison.
 */
export async function hashPassword(password: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function validateLogin(username: string, passwordPlain: string, accounts: Account[]): Promise<UserSession | null> {
  const account = accounts.find(a => a.username.toLowerCase() === username.toLowerCase());
  if (!account) return null;

  const enteredHash = await hashPassword(passwordPlain);
  
  // Direct comparison with spreadsheet hash
  if (enteredHash === account.passwordHash.toLowerCase()) {
    return {
      username: account.username,
      sdo: account.sdo,
      schoolName: account.schoolName,
      email: account.email
    };
  }
  return null;
}

export function saveSession(session: UserSession) {
  localStorage.setItem('ftad_session', JSON.stringify(session));
}

export function getSession(): UserSession | null {
  const raw = localStorage.getItem('ftad_session');
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem('ftad_session');
}
