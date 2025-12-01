import { cacheLife } from 'next/cache';
import { cookies } from 'next/headers';

async function getSidebarStatusCache() {
	'use cache: private';
	cacheLife('days');

	const cookieStore = await cookies();

	const cookie = cookieStore.get('sidebar_state')?.value;

	const defaultOpen = cookie === 'true';

	return !cookie ? true : defaultOpen;
}

export { getSidebarStatusCache };
