import { environment } from '@/environment';
import { cache } from '@/services/cache';
import { transfeeraAuth } from '@/services/pix/transfeera';

const CACHE_KEY = 'transfeera:token:auth';

const SECURITY_SECONDS = 60;

async function transfeeraGetTokenAuth() {
	const isCache = await cache.exists(CACHE_KEY);

	if (isCache) {
		const token = await cache.get(CACHE_KEY);

		return token;
	}

	const { data, status } = await transfeeraAuth.post('/authorization', {
		grant_type: 'client_credentials',
		client_id: environment.TRANSFEERA_CLIENT_SECRET_USER,
		client_secret: environment.TRANSFEERA_CLIENT_SECRET,
	});

	if (status !== 200) {
		throw Error(
			`Falha ao gerar token de autenticação na adquirente: ${data.message}`,
		);
	}

	const token = data.access_token;
	const expires = data.expires_in;

	await cache.set(CACHE_KEY, token, 'EX', expires - SECURITY_SECONDS);

	return token;
}

export { transfeeraGetTokenAuth };
