
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

  const { office, division, period, targetIndex, status, username } = request.body;

  if (!office || !division || status === undefined) {
    return response.status(400).json({ error: 'Missing identifying data for status update.' });
  }

  try {
    // 1. Ensure the overrides table exists
    await sql`
      CREATE TABLE IF NOT EXISTS tap_status_updates (
        id SERIAL PRIMARY KEY,
        office TEXT NOT NULL,
        division TEXT NOT NULL,
        period TEXT NOT NULL,
        target_index INTEGER NOT NULL,
        status TEXT NOT NULL,
        updated_by TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(office, division, period, target_index)
      );
    `;

    // 2. Upsert the status update
    await sql`
      INSERT INTO tap_status_updates (office, division, period, target_index, status, updated_by, updated_at)
      VALUES (${office}, ${division}, ${period}, ${targetIndex}, ${status}, ${username}, CURRENT_TIMESTAMP)
      ON CONFLICT (office, division, period, target_index) 
      DO UPDATE SET 
        status = EXCLUDED.status,
        updated_by = EXCLUDED.updated_by,
        updated_at = EXCLUDED.updated_at;
    `;

    return response.status(200).json({ message: "Status synchronized with Cloud DB." });

  } catch (error: any) {
    console.error("Postgres Status Update Error:", error);
    return response.status(500).json({ error: `Sync Error: ${error.message}` });
  }
}
