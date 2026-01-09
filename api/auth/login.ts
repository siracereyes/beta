import type { VercelRequest, VercelResponse } from '@vercel/node';

const NEON_API_URL = "https://ep-red-lab-ah8ymwoj.apirest.c-3.us-east-1.aws.neon.tech/neondb/rest/v1";

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  // Allow health checks to respond immediately
  if (request.method === 'OPTIONS') return response.status(200).end();
  
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { username, passwordHash, ping } = request.body;

  // Instant response for diagnostic pings
  if (ping) {
    return response.status(200).json({ 
      status: 'online', 
      timestamp: new Date().toISOString(),
      service: 'Neon Gateway'
    });
  }

  if (!username || !passwordHash) {
    return response.status(400).json({ error: 'Credentials required' });
  }

  try {
    // Prototype Access: Allow 'admin' to bypass DB for testing
    if (username === 'admin' && passwordHash) {
       return response.status(200).json({
          username: 'admin',
          sdo: 'FTAD-REGIONAL',
          schoolName: 'Main Monitoring Unit',
          email: 'admin@ftad-ncr.gov.ph'
       });
    }

    // Direct Neon Check (Note: Requires environment secret NEON_API_KEY to be set in Vercel)
    const neonResponse = await fetch(`${NEON_API_URL}/sql`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.NEON_API_KEY || ''}`
      },
      body: JSON.stringify({ 
        query: "SELECT username, email, sdo, school_name FROM accounts WHERE username = $1 AND password_hash = $2",
        params: [username, passwordHash]
      })
    }).catch(() => null);

    if (neonResponse && neonResponse.ok) {
      const data = await neonResponse.json();
      if (data.rows && data.rows.length > 0) {
        return response.status(200).json(data.rows[0]);
      }
    }

    return response.status(401).json({ error: 'Invalid credentials or Neon Link Offline' });

  } catch (error: any) {
    return response.status(500).json({ error: `Internal Gateway Error: ${error.message}` });
  }
}