import { cacheLife } from 'next/cache';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';

async function getSessionCache() {
	'use cache: private';
	cacheLife('hours');

	const headerList = await headers();

	const { data } = await auth.getSession({
		fetchOptions: {
			headers: headerList,
		},
	});

	if (!data) {
		await auth.signOut({
			fetchOptions: {
				headers: headerList,
			},
		});

		return redirect('/');
	}

	return data;
}

export { getSessionCache };
