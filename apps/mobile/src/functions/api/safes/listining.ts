import { api } from '@/libraries/api';
import { storage } from '@/libraries/storage';
import type {
	ResponseDataCursor,
	SafeRegistration,
	SafeSimple,
} from '@segwise/core/types';
import { format } from 'date-fns';
import { XiorError } from 'xior';

async function safesListining({ signal }: { signal: AbortSignal }) {
	const myFiltersRegistration = storage.getString(
		'filters:insurances:registrations',
	);

	const myFiltersIds = storage.getString('filters:insurances:ids');
	const myFiltersIdsExcludes = storage.getString(
		'filters:insurances:ids:excludes',
	);

	if (!myFiltersRegistration && !myFiltersIds) {
		return {
			data: [],
		};
	}

	const url = new URL(`${api.config?.baseURL}/safes/simple`);

	if (myFiltersIds) {
		const items = JSON.parse(myFiltersIds);

		for (const item of items) {
			url.searchParams.append('ids', item);
		}
	}

	if (myFiltersRegistration) {
		const items = JSON.parse(myFiltersRegistration);

		for (const item of items) {
			url.searchParams.append('registrations', item);
		}
	}

	if (myFiltersIdsExcludes) {
		const items = JSON.parse(myFiltersIdsExcludes);

		for (const item of items) {
			url.searchParams.append('excludes', item);
		}
	}

	const { data } = await api.get<ResponseDataCursor<SafeSimple>>(
		url.toString(),
		{
			signal,
		},
	);

	return data;
}

async function safesListiningRegistration({
	registration,
	birth,
}: SafeRegistration) {
	try {
		const url = new URL(`${api.config?.baseURL}/safes/simple/registration`);

		url.searchParams.set('registration', registration);
		url.searchParams.set('birth', format(birth, 'dd/MM/yyyy'));

		const { data } = await api.get<ResponseDataCursor<SafeSimple>>(
			url.toString(),
		);

		return data;
	} catch (error) {
		if (error instanceof XiorError) {
			throw new Error(error.response?.data.message || 'Ocorreu algum erro');
		}

		throw error;
	}
}

export { safesListining, safesListiningRegistration };
