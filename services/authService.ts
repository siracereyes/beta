
import { UserSession } from "../types";

export async function hashPassword(password: string): Promise<string> {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error("Security Error: Insecure context or missing Crypto API.");
  }
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function testApiConnection(): Promise<string> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch('/api/auth/login', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ping: true }),
      signal: controller.signal
    });
    clearTimeout(id);
    const data = await res.json();
    return `DB Connectivity: ${data.status || 'Active'}`;
  } catch (err: any) {
    clearTimeout(id);
    return `Cloud Fault: ${err.message}`;
  }
}

export async function validateLogin(username: string, passwordPlain: string, onStatus?: (s: string) => void): Promise<UserSession | null> {
  const passwordHash = await hashPassword(passwordPlain);
  onStatus?.("Authenticating with Cloud DB...");

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, passwordHash })
  });
  
  const data = await response.json();
  
  if (response.ok) {
    onStatus?.("Registry Verified.");
    return data;
  }

  throw new Error(data.error || "Authentication failed.");
}

export async function registerUser(data: { 
  username: string; 
  passwordPlain: string; 
  email: string; 
  sdo: string; 
  schoolName: string 
}, onStatus?: (s: string) => void): Promise<UserSession | null> {
  const passwordHash = await hashPassword(data.passwordPlain);
  
  onStatus?.("Writing to Cloud Registry...");
  
  const response = await fetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username: data.username,
      passwordHash: passwordHash,
      email: data.email,
      sdo: data.sdo,
      schoolName: data.schoolName
    })
  });

  const result = await response.json();

  if (response.ok) {
    onStatus?.("Cloud Entry Confirmed.");
    return {
      username: result.username,
      sdo: result.sdo,
      schoolName: result.schoolName,
      email: result.email
    };
  }

  throw new Error(result.error || "Enrollment failed.");
}

export function saveSession(session: UserSession) {
  localStorage.setItem('ftad_session', JSON.stringify(session));
}

export function getSession(): UserSession | null {
  const raw = localStorage.getItem('ftad_session');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export function clearSession() {
  localStorage.removeItem('ftad_session');
}
