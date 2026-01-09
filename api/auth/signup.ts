
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

  const { username, passwordHash, email, sdo, schoolName } = request.body;

  if (!username || !passwordHash || !sdo) {
    return response.status(400).json({ error: 'Missing required fields (Username, Password, SDO)' });
  }

  try {
    // 1. Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS users_registry (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        sdo TEXT NOT NULL,
        school_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Check if user exists
    const existingUser = await sql`SELECT id FROM users_registry WHERE username = ${username} LIMIT 1;`;
    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return response.status(409).json({ error: 'Username already registered in database.' });
    }

    // 3. Insert user
    await sql`
      INSERT INTO users_registry (username, password_hash, email, sdo, school_name)
      VALUES (${username}, ${passwordHash}, ${email}, ${sdo}, ${schoolName});
    `;

    return response.status(201).json({
      username,
      sdo,
      schoolName,
      email,
      message: "Successfully synchronized with Cloud Database."
    });

  } catch (error: any) {
    console.error("Postgres Signup Error:", error);
    return response.status(500).json({ error: `Database Error: ${error.message}` });
  }
}
