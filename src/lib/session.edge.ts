'use server';
import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.SESSION_SECRET || 'your-super-secret-key';
const key = new TextEncoder().encode(secretKey);

async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

// This function is safe to use in middleware as it does NOT import db
export async function getSessionPayload() {
  const sessionCookie = (await cookies()).get('session')?.value;
  return await decrypt(sessionCookie);
}
