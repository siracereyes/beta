import { UserSession } from "../types";

/**
 * Hashes a string using SHA-256 for secure transmission.
 */
export async function hashPassword(password: string): Promise<string> {
  if (!window.crypto || !window.crypto.subtle) {
    // Fallback for extremely old/insecure browsers if necessary, 
    // but modern DepEd systems should support SubtleCrypto.
    throw new Error("Security Error: SubtleCrypto not supported or insecure context.");
  }
  const msgBuffer = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Simplified Telemetry Test (No external dependencies)
 */
export async function testApiConnection(): Promise<string> {
  const timeoutMs = 10000; // Increased to 10s for slow proxies
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch('/api/auth/login', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ping: true }),
      signal: controller.signal
    });
    clearTimeout(id);
    return `Server Active: HTTP ${res.status}`;
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') return "FAILED: Gateway Timeout (10s)";
    return `FAILED: ${err.message || "Connection Interrupted"}`;
  }
}

async function secureFetch(url: string, body: object, onStatus?: (s: string) => void): Promise<any> {
  const timeoutMs = 15000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    onStatus?.("Authenticating...");
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
      throw new Error(errorMsg || `Error ${response.status}`);
    }
    
    return await response.json();
  } catch (err: any) {
    clearTimeout(id);
    if (err.name === 'AbortError') throw new Error("Request Timed Out (15s)");
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