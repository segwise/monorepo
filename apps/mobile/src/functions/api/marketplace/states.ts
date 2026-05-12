import { api } from '@/libraries/api';
import { XiorError } from 'xior';

async function states() {
	try {
		const { data } = await api.get<Array<string>>('/marketplace/states');

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			throw new Error(error.response?.data.message || 'Falha ao consultar');
		}

		throw error;
	}
}

export { states };
