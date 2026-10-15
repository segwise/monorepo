import type { MarketplaceSignIn } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import type { XiorError } from 'xior';
import { fetchApi } from '@/functions/api';

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
