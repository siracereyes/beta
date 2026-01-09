
import { sql } from '@vercel/postgres';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.POSTGRES_URL) {
    return response.status(500).json({ error: 'Database environment variables are missing. Please connect Vercel Postgres.' });
  }

  const { username, passwordHash, email, sdo, schoolName } = request.body;

  if (!username || !passwordHash || !email) {
    return response.status(400).json({ error: 'Username, password, and email are required fields.' });
  }

  try {
    // 1. Ensure Table Exists (Simple Auto-Migration)
    await sql`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        sdo VARCHAR(255),
        school_name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Check if user already exists
    const existingUser = await sql`
      SELECT id FROM accounts WHERE username = ${username} OR email = ${email} LIMIT 1;
    `;

    if (existingUser.rowCount && existingUser.rowCount > 0) {
      return response.status(409).json({ error: 'Username or Email is already registered.' });
    }

    // 3. Insert new account
    await sql`
      INSERT INTO accounts (username, password_hash, email, sdo, school_name)
      VALUES (${username}, ${passwordHash}, ${email}, ${sdo || ''}, ${schoolName || ''});
    `;

    // 4. Return the session object
    return response.status(201).json({
      username,
      email,
      sdo,
      schoolName
    });
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return response.status(500).json({ 
      error: 'Failed to create account in the database.',
      details: error.message 
    });
  }
}
