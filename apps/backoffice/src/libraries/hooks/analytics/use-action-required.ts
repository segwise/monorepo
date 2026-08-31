import { faker } from '@faker-js/faker';
import { useQuery } from '@tanstack/react-query';

type ActionRequiredKind =
	| 'quote-stalled'
	| 'policy-expiring'
	| 'claim-stalled'
	| 'proposal-pending-approval';

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

const GROUP_META: Record<ActionRequiredKind, { title: string; href: string }> =
	{
		'quote-stalled': {
			title: 'Cotações paradas',
			href: '/quotes?filter=stalled',
		},
		'policy-expiring': {
			title: 'Apólices vencendo',
			href: '/policies?filter=expiring',
		},
		'claim-stalled': {
			title: 'Sinistros sem movimentação',
			href: '/claims?filter=stalled',
		},
		'proposal-pending-approval': {
			title: 'Propostas aguardando aprovação',
			href: '/proposals?filter=pending-approval',
		},
	};

function generateMockActionRequired(): ActionRequiredResponse {
	const groups = (Object.keys(GROUP_META) as Array<ActionRequiredKind>).map(
		(kind) => {
			const meta = GROUP_META[kind];
			const count = faker.number.int({ min: 0, max: 12 });
			const items: Array<ActionRequiredItem> = Array.from(
				{ length: Math.min(count, 5) },
				() => ({
					id: faker.string.uuid(),
					kind,
					label: faker.company.name(),
					daysOpen: faker.number.int({ min: 1, max: 45 }),
					href: meta.href,
				}),
			);

			return { kind, title: meta.title, count, href: meta.href, items };
		},
	);

	return {
		groups,
		totalCount: groups.reduce((acc, group) => acc + group.count, 0),
	};
}

const useActionRequired = () =>
	useQuery({
		queryKey: ['analytics', 'action-required'],
		queryFn: async (): Promise<ActionRequiredResponse> => {
			await new Promise((resolve) => setTimeout(resolve, 300));
			return generateMockActionRequired();
		},
	});

export { useActionRequired };
export type { ActionRequiredItem, ActionRequiredGroup, ActionRequiredKind };
