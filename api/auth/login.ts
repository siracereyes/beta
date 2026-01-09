
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Server-side login handler. 
 * This keeps your database credentials secure on the server.
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { username, passwordHash } = request.body;

  if (!username || !passwordHash) {
    return response.status(400).json({ error: 'Missing credentials' });
  }

  try {
    // Query the database for the user
    const { rows } = await sql`
      SELECT username, sdo, school_name as "schoolName", email, password_hash 
      FROM accounts 
      WHERE username = ${username}
      LIMIT 1;
    `;

    const user = rows[0];

    if (!user) {
      return response.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare the provided hash with the stored hash
    if (user.password_hash === passwordHash) {
      // Remove sensitive data before sending to client
      const { password_hash, ...session } = user;
      return response.status(200).json(session);
    } else {
      return response.status(401).json({ error: 'Invalid username or password' });
    }
  } catch (error) {
    console.error('Database Authentication Error:', error);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
