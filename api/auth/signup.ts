import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Note: Edge Config is optimized for READS. 
 * For a prototype, signup usually requires manual addition to the Edge Config JSON via Vercel Dashboard,
 * or using the Vercel API with a Token.
 */
export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  const { username, email, sdo, schoolName } = request.body;

  // For this prototype version using Edge Config, we acknowledge the signup
  // but note that the user must be synced to the Edge Config to login.
  return response.status(201).json({
    username,
    email,
    sdo,
    schoolName,
    message: "Registration received. Edge Registry sync pending."
  });
}