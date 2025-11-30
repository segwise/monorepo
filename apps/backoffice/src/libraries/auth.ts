import { createAuthClient } from 'better-auth/react';

const auth = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
	basePath: '/auth',
});

export { auth };
