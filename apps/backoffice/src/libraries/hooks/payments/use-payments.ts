import type { PaymentSimple, ResponseDataCursor } from '@segwise/core/types';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';
import type { SearchParamsProps } from '@/libraries/search-params/payments';

const usePaymentsCashFlowSimple = (props: SearchParamsProps) =>
	useQuery({
		queryKey: ['payments', 'simple', 'cash-flow', props],
		queryFn: async ({ signal }) =>
			(
				await api.get<ResponseDataCursor<PaymentSimple>>(
					'/payments/cash-flow/simple',
					{
						params: props,
						signal,
					},
				)
			).data,
	});

export { usePaymentsCashFlowSimple };
