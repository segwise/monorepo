import type { ProducerReferral } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import type { XiorError } from 'xior';
import { fetchApi } from '@/functions/api';

const useReferral = () =>
	useMutation<
		Awaited<ReturnType<typeof fetchApi.referral>>,
		XiorError,
		ProducerReferral
	>({
		mutationKey: ['referral'],
		mutationFn: fetchApi.referral,
	});

export { useReferral };
