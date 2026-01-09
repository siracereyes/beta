
import { kv } from '@vercel/kv';
import { db } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Vercel Serverless Function for Authentication.
 * This runs on the server side where it's safe to use DB credentials.
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { username, password } = request.body;

  if (!username || !password) {
    return response.status(400).json({ error: 'Missing credentials' });
  }

  try {
    const client = await db.connect();
    
    // Query the Postgres 'accounts' table
    // We use a parameterized query to prevent SQL injection
    const { rows } = await client.sql`
      SELECT username, password, email, sdo, school_name 
      FROM accounts 
      WHERE LOWER(username) = LOWER(${username})
      LIMIT 1;
    `;

    if (rows.length === 0) {
      return response.status(401).json({ error: 'User not found' });
    }

    const user = rows[0];

    // Password comparison (ideally use bcrypt here)
    if (user.password === password) {
      return response.status(200).json({
        username: user.username,
        email: user.email,
        sdo: user.sdo,
        schoolName: user.school_name
      });
    } else {
      return response.status(401).json({ error: 'Invalid password' });
    }
  } catch (error) {
    console.error('Database Error:', error);
    return response.status(500).json({ error: 'Internal server error' });
  }
}
