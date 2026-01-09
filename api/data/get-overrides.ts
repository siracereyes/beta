
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'GET') return response.status(405).end();

  try {
    const { rows } = await sql`
      SELECT office, division, period, target_index, status 
      FROM tap_status_updates;
    `;
    return response.status(200).json({ overrides: rows });
  } catch (error) {
    // If table doesn't exist yet, just return empty
    return response.status(200).json({ overrides: [] });
  }
}
