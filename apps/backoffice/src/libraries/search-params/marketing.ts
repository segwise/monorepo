import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

const CONTACT_STATUSES = [
	'never',
	'sent',
	'delivered',
	'opened',
	'clicked',
	'bounced',
	'complained',
	'failed',
] as const;

const useCampaignSearchParams = () =>
	useQueryStates({
		search: parseAsString,
		status: parseAsStringEnum(['active', 'paused'] as const),
		template: parseAsString,
		frequency: parseAsStringEnum(['daily', 'monthly'] as const),
	});

const useContactSearchParams = () =>
	useQueryStates({
		search: parseAsString,
		status: parseAsStringEnum([...CONTACT_STATUSES]),
		from: parseAsString,
		to: parseAsString,
	});

export { CONTACT_STATUSES, useCampaignSearchParams, useContactSearchParams };
