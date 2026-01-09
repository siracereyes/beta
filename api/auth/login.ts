import type { VercelRequest, VercelResponse } from '@vercel/node';
import { get } from '@vercel/edge-config';

/**
 * Vercel Edge Config Login Handler
 * Requires EDGE_CONFIG environment variable to be set in Vercel Dashboard.
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === 'OPTIONS') return response.status(200).end();
  
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { username, passwordHash, ping } = request.body;

  if (ping) {
    return response.status(200).json({ 
      status: 'Edge Connected', 
      latency: 'Ultra-Low',
      node: process.env.VERCEL_REGION || 'global'
    });
  }

  if (!username || !passwordHash) {
    return response.status(400).json({ error: 'Credentials required' });
  }

  try {
    // Prototype: Admin bypass
    if (username === 'admin' && passwordHash) {
       return response.status(200).json({
          username: 'admin',
          sdo: 'FTAD-REGIONAL',
          schoolName: 'Main Monitoring Unit',
          email: 'admin@ftad-ncr.gov.ph'
       });
    }

    // Read users from Edge Config
    // Expected structure in Edge Config: { "users": { "username": { "passwordHash": "...", ... } } }
    const users: any = await get('users');
    
    if (users && users[username]) {
      const user = users[username];
      if (user.passwordHash === passwordHash) {
        return response.status(200).json({
          username: username,
          email: user.email,
          sdo: user.sdo,
          schoolName: user.schoolName
        });
      }
    }

    return response.status(401).json({ error: 'Invalid credentials or User not in Edge Registry' });

  } catch (error: any) {
    return response.status(500).json({ error: `Edge Logic Error: ${error.message}` });
  }
}