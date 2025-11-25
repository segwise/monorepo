import { createAuthClient } from 'better-auth/react';

const { signIn, signOut, requestPasswordReset, useSession } = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
	basePath: '/auth',
});

export { signIn, signOut, useSession, requestPasswordReset };
