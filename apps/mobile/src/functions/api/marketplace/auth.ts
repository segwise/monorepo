import type { MarketplaceSignIn } from '@segwise/core/types';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

async function signIn(props: MarketplaceSignIn) {
	try {
		const { data } = await api.get('/marketplace/auth', {
			params: props,
		});

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			throw new Error(error.response?.data.message || 'Falha ao acessar');
		}

		throw error;
	}
}

export { signIn };
