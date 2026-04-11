import { fetch } from 'expo/fetch';
import xior from 'xior';
import { environment } from './environment';

const api = xior.create({
	baseURL: environment.API_URL,
	timeout: 15000,
	fetch,
});

export { api };
