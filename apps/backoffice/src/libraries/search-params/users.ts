import { STAFF_ROLES } from '@segwise/core/utils';
import { parseAsString, parseAsStringEnum, useQueryStates } from 'nuqs';

const useUsersSearchParams = () =>
	useQueryStates({
		search: parseAsString,
		role: parseAsStringEnum([...STAFF_ROLES]),
		status: parseAsStringEnum([
			'active',
			'suspended',
			'deleted',
			'pending',
		] as const),
	});

export { useUsersSearchParams };
