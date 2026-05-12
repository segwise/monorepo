import xior from 'xior';

import { transfeeraGetTokenAuth } from '@/functions/pix/transfeera/get-token';

const transfeeraAuth = xior.create({
	baseURL: 'https://login-api.transfeera.com',
	headers: {
		accept: 'application/json',
		'content-type': 'application/json',
	},
});

const transfeera = xior.create({
	baseURL: 'https://api.transfeera.com',
	headers: {
		accept: 'application/json',
		'content-type': 'application/json',
		'User-Agent': 'Segwise (contato@segwise.com.br)',
	},
});

transfeera.interceptors.request.use(async (request) => {
	request.headers.Authorization = `Bearer ${await transfeeraGetTokenAuth()}`;

	return request;
});

export { transfeeraAuth, transfeera };
