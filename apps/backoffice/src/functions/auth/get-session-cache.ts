import { cacheLife } from 'next/cache';
import { headers } from 'next/headers';
import { RedirectType, redirect } from 'next/navigation';
import { auth } from '@/auth';

async function getSessionCache() {
	'use cache: private';
	cacheLife('hours');

	const headerList = await headers();

	const newHeader = new Headers(headerList);

	newHeader.set('X-Client-App', process.env.NEXT_PUBLIC_ROLE_SYSTEM as string);
	newHeader.set('X-timezone', Intl.DateTimeFormat().resolvedOptions().timeZone);

	const { data } = await auth.getSession({
		fetchOptions: {
			headers: newHeader,
		},
	});

	if (!data) {
		await auth.signOut({
			fetchOptions: {
				headers: headerList,
			},
		});

		return redirect(
			`/${process.env.ROLE_SYSTEM}/sign-in`,
			RedirectType.replace,
		);
	}

	return data;
}

export { getSessionCache };
