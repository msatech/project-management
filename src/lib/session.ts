import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { db } from './db';
import type { User, Organization, Project } from '@prisma/client';

const secretKey = process.env.SESSION_SECRET || 'your-super-secret-key';
const key = new TextEncoder().encode(secretKey);

export async function encrypt(payload: any) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);
}

export async function decrypt(session: string | undefined = '') {
  try {
    const { payload } = await jwtVerify(session, key, {
      algorithms: ['HS256'],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function createSession(userId: string) {
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await encrypt({ userId, expires });

  cookies().set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  });
}

// This function is safe to use in middleware
export async function getSessionPayload() {
  const sessionCookie = cookies().get('session')?.value;
  return await decrypt(sessionCookie);
}


export async function getSession() {
  const payload = await getSessionPayload();

  if (!payload?.userId) {
    return null;
  }

  const user = await db.user.findUnique({
    where: { id: payload.userId as string },
    include: {
        organizations: {
            include: {
                organization: {
                    include: {
                        projects: true
                    }
                }
            }
        }
    }
  });

  if (!user) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { hashedPassword, ...userWithoutPassword } = user;

  return { user: userWithoutPassword };
}

export async function deleteSession() {
  cookies().delete('session');
}
