import { fetchApi } from '@/functions/api';
import type { QuoteFinancingRegister } from '@segwise/core/types';
import { useMutation } from '@tanstack/react-query';
import type { XiorError } from 'xior';

const useFinancingRegister = () =>
	useMutation<
		Awaited<ReturnType<typeof fetchApi.financing.register>>,
		XiorError,
		QuoteFinancingRegister
	>({
		mutationKey: ['financing', 'register'],
		mutationFn: fetchApi.financing.register,
	});

export { useFinancingRegister };
