'use server';

import { cookies } from 'next/headers';
import type { AuthUser } from '@/lib/auth/types';
import {
	readSessionFromCookie,
	SESSION_COOKIE_NAME,
} from '@/lib/auth/server-session';

export async function getSessionUser(): Promise<AuthUser | null> {
	const cookieStore = await cookies();
	const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
	const session = readSessionFromCookie(sessionCookie);
	return session.user;
}
