import { cacheLife } from 'next/cache';

async function getCurrentYear() {
	'use cache';
	cacheLife('days');

	return new Date().getUTCFullYear();
}

export { getCurrentYear };
