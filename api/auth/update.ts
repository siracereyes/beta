
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method === 'OPTIONS') return response.status(200).end();
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { username, sdo, schoolName, passwordHash } = request.body;

  if (!username) {
    return response.status(400).json({ error: 'Username is required to update settings.' });
  }

  try {
    // 1. Check if user exists
    const userCheck = await sql`SELECT id FROM users_registry WHERE username = ${username} LIMIT 1;`;
    if (!userCheck.rowCount || userCheck.rowCount === 0) {
      return response.status(404).json({ error: 'User not found in registry.' });
    }

    // 2. Prepare dynamic update
    if (passwordHash) {
      await sql`
        UPDATE users_registry 
        SET sdo = ${sdo}, school_name = ${schoolName}, password_hash = ${passwordHash}
        WHERE username = ${username};
      `;
    } else {
      await sql`
        UPDATE users_registry 
        SET sdo = ${sdo}, school_name = ${schoolName}
        WHERE username = ${username};
      `;
    }

    return response.status(200).json({
      username,
      sdo,
      schoolName,
      message: "Account settings synchronized successfully."
    });

  } catch (error: any) {
    console.error("Postgres Update Error:", error);
    return response.status(500).json({ error: `Database Update Error: ${error.message}` });
  }
}
