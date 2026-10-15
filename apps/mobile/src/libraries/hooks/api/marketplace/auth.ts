import { fetchApi } from '@/functions/api';
import type { MarketplaceSignIn } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import type { XiorError } from 'xior';

const useMarketplaceSignIn = () =>
	useMutation<
		Awaited<ReturnType<typeof fetchApi.marketplace.signIn>>,
		XiorError,
		MarketplaceSignIn
	>({
		mutationKey: ['marketplace', 'sign-in'],
		mutationFn: fetchApi.marketplace.signIn,
	});

export { useMarketplaceSignIn };
