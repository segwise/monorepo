import { cacheLife } from 'next/cache';
import { headers } from 'next/headers';
import { auth } from '@/libraries/auth';

async function getSessionCache() {
	'use cache: private';

	cacheLife('hours');

	const headerList = await headers();

	const { data } = await auth.getSession({
		fetchOptions: {
			headers: headerList,
		},
	});

	return data;
}

export { getSessionCache };
