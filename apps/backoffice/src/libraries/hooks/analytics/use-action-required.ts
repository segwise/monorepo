import { useQuery } from '@tanstack/react-query';
import { api } from '@/libraries/api';

type ActionRequiredKind =
	| 'quote-stalled'
	| 'quote-awaiting-customer'
	| 'policy-expiring'
	| 'payment-overdue';

interface ActionRequiredItem {
	id: string;
	kind: ActionRequiredKind;
	label: string;
	daysOpen: number;
	href: string;
}

interface ActionRequiredGroup {
	kind: ActionRequiredKind;
	title: string;
	count: number;
	href: string;
	items: Array<ActionRequiredItem>;
}

interface ActionRequiredResponse {
	groups: Array<ActionRequiredGroup>;
	totalCount: number;
}

const useActionRequired = () =>
	useQuery({
		queryKey: ['analytics', 'action-required'],
		queryFn: async ({ signal }) =>
			(
				await api.get<ActionRequiredResponse>(
					'/analytics/dashboard/action-required',
					{ signal },
				)
			).data,
	});

export { useActionRequired };
export type { ActionRequiredItem, ActionRequiredGroup, ActionRequiredKind };
