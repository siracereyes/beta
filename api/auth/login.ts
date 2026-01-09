
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { get } from '@vercel/edge-config';
import { sql } from '@vercel/postgres';

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
      status: 'Cloud & Edge Sync Active', 
      node: process.env.VERCEL_REGION || 'global'
    });
  }

  if (!username || !passwordHash) {
    return response.status(400).json({ error: 'Credentials required' });
  }

  try {
    // 1. Hardcoded Admin Bypass
    if (username === 'admin' || username === 'siracereyes') {
       return response.status(200).json({
          username: username,
          sdo: 'FTAD-REGIONAL',
          schoolName: 'Main Monitoring Unit',
          email: 'admin@ftad-ncr.gov.ph'
       });
    }

    // 2. Check Database Registry
    const { rows } = await sql`
      SELECT username, password_hash, sdo, school_name, email 
      FROM users_registry 
      WHERE username = ${username} 
      LIMIT 1;
    `;

    if (rows && rows.length > 0) {
      const user = rows[0];
      if (user.password_hash === passwordHash) {
        return response.status(200).json({
          username: user.username,
          sdo: user.sdo,
          schoolName: user.school_name,
          email: user.email
        });
      }
      return response.status(401).json({ error: 'Incorrect credentials.' });
    }

    // 3. Fallback to Edge Config (Legacy Admins)
    const users: any = await get('users');
    if (users && users[username]) {
      const user = users[username];
      if (user.passwordHash === passwordHash) {
        return response.status(200).json({
          username,
          sdo: user.sdo,
          schoolName: user.schoolName,
          email: user.email
        });
      }
    }

    return response.status(404).json({ error: 'Account not found in cloud registry.' });

  } catch (error: any) {
    console.error("Login Handler Error:", error);
    return response.status(500).json({ error: `Auth Engine Error: ${error.message}` });
  }
}
