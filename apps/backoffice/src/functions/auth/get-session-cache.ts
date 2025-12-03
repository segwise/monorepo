import { cacheLife } from 'next/cache';
import { headers } from 'next/headers';
import { cache } from 'react';
import { auth } from '@/libraries/auth';

const getSessionCache = cache(async () => {
	'use cache: private';
	cacheLife('hours');

	const headerList = await headers();

	const { data } = await auth.getSession({
		fetchOptions: {
			headers: headerList,
		},
	});

	return {
		...data,
		user: {
			...data?.user,
			name: Math.floor(Math.random() * 1000),
		},
	};
});

export { getSessionCache };
