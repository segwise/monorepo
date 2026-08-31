import { faker } from '@faker-js/faker';
import { useQuery } from '@tanstack/react-query';
import type { ResolvedPeriod } from '@/containers/cards/dashboard/period-filter';

interface ConversionFunnelStage {
	stage: 'leads' | 'quotes' | 'proposals' | 'policies';
	label: string;
	value: number;
}

interface ConversionFunnelResponse {
	stages: Array<ConversionFunnelStage>;
}

const useConversionFunnel = (period: ResolvedPeriod) =>
	useQuery({
		queryKey: [
			'analytics',
			'conversion-funnel',
			period.preset,
			period.current.from.toISOString(),
		],
		queryFn: async (): Promise<ConversionFunnelResponse> => {
			await new Promise((resolve) => setTimeout(resolve, 300));

			const leads = faker.number.int({ min: 200, max: 500 });
			const quotes = faker.number.int({ min: 100, max: leads });
			const proposals = faker.number.int({ min: 40, max: quotes });
			const policies = faker.number.int({ min: 10, max: proposals });

			return {
				stages: [
					{ stage: 'leads', label: 'Leads', value: leads },
					{ stage: 'quotes', label: 'Cotações', value: quotes },
					{ stage: 'proposals', label: 'Propostas', value: proposals },
					{ stage: 'policies', label: 'Apólices Ativas', value: policies },
				],
			};
		},
	});

export { useConversionFunnel };
export type { ConversionFunnelStage, ConversionFunnelResponse };
