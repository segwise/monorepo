import type {
	ProducerReferral,
	ProducerReferralResponse,
} from '@segwise/core/types';
import { XiorError } from 'xior';
import { api } from '@/libraries/api';

async function getReferral({ referral }: ProducerReferral) {
	try {
		const { data } = await api.get<ProducerReferralResponse>(
			`/producers/referral/${referral}`,
		);

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			throw new Error(
				error.response?.data?.message || 'Falha ao consultar código',
			);
		}

		throw error;
	}
}

export { getReferral };
