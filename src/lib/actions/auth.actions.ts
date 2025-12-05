'use server';

import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';

import { db } from '@/lib/db';
import { createSession, deleteSession } from '@/lib/session';
import { loginSchema, registerSchema } from '@/lib/validators';

export async function register(values: z.infer<typeof registerSchema>) {
  const validatedFields = registerSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid fields!' };
  }

  const { name, email, password } = validatedFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);

  const existingUser = await db.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return { error: 'An account with this email already exists.' };
  }
  
  try {
    const user = await db.user.create({
      data: {
        name,
        email,
        hashedPassword,
      },
    });

    // Create a default organization for the new user
    await db.organization.create({
        data: {
          name: `${name}'s Organization`,
          slug: `${name.toLowerCase().replace(/\s+/g, '-')}-org`,
          ownerId: user.id,
          members: {
            create: {
              userId: user.id,
              orgRole: 'OWNER',
            },
          },
        },
      });

    await createSession(user.id);
  } catch (error) {
    console.error(error);
    return { error: 'Could not create account. Please try again.' };
  }
  
  redirect('/app');
}

export async function login(values: z.infer<typeof loginSchema>, redirectUrl: string | null) {
  const validatedFields = loginSchema.safeParse(values);

  if (!validatedFields.success) {
    return { error: 'Invalid fields!' };
  }

  const { email, password } = validatedFields.data;

  const user = await db.user.findUnique({
    where: { email },
  });

  if (!user || !user.hashedPassword) {
    return { error: 'Invalid credentials.' };
  }

  const passwordMatch = await bcrypt.compare(password, user.hashedPassword);

  if (!passwordMatch) {
    return { error: 'Invalid credentials.' };
  }

  await createSession(user.id);

  if (redirectUrl) {
    redirect(redirectUrl);
  }

  // Find the first organization and project to redirect to
  const firstOrgMember = await db.organizationMember.findFirst({
    where: { userId: user.id },
    include: { organization: { include: { projects: { orderBy: { createdAt: 'asc' }, take: 1 } } } },
    orderBy: { createdAt: 'asc' },
  });

  if (firstOrgMember) {
    const org = firstOrgMember.organization;
    const project = org.projects[0];
    if (project) {
        redirect(`/app/${org.slug}/${project.key}`);
    }
    redirect(`/app/${org.slug}`);
  }

  redirect('/app/create-organization');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}
