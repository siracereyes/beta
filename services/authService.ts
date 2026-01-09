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
    return `Status: ${data.status || 'Active'} | Node: ${data.node || 'Edge'}`;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') return "Edge Link Timeout (8s)";
    return `Edge Link Fault: ${err.message}`;
  }
}

async function secureFetch(url: string, body: object, onStatus?: (s: string) => void): Promise<any> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 12000);

  try {
    onStatus?.("Checking Edge Registry...");
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });
    
    clearTimeout(id);
    
    if (!response.ok) {
      const text = await response.text();
      let errorMsg = text;
      try { errorMsg = JSON.parse(text).error; } catch { }
      throw new Error(errorMsg || `Gateway Error ${response.status}`);
    }
    
    return await response.json();
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error("Connection Timed Out (12s)");
    throw err;
  }
}

export async function validateLogin(username: string, passwordPlain: string, onStatus?: (s: string) => void): Promise<UserSession | null> {
  const hashedPassword = await hashPassword(passwordPlain);
  return await secureFetch('/api/auth/login', { username, passwordHash: hashedPassword }, onStatus);
}

export async function registerUser(data: { 
  username: string; 
  passwordPlain: string; 
  email: string; 
  sdo: string; 
  schoolName: string 
}, onStatus?: (s: string) => void): Promise<UserSession | null> {
  const hashedPassword = await hashPassword(data.passwordPlain);
  return await secureFetch('/api/auth/signup', {
    username: data.username,
    passwordHash: hashedPassword,
    email: data.email,
    sdo: data.sdo,
    schoolName: data.schoolName
  }, onStatus);
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