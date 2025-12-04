import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const auth = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
	basePath: '/auth',
	plugins: [adminClient()],
	fetchOptions: {
		credentials: 'include',
	},
});

export { auth };
