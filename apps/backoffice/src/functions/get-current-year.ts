import { connection } from 'next/server';

async function getCurrentYear() {
	await connection();

	return new Date().getUTCFullYear();
}

export { getCurrentYear };
