import { api } from '@/libraries/api';
import { storage } from '@/libraries/storage';
import type {
	ResponseDataCursor,
	SafeRegistration,
	SafeSimple,
} from '@segwise/core/types';
import { endOfDay, format, parseISO } from 'date-fns';
import { XiorError } from 'xior';

async function safesListining({ signal }: { signal: AbortSignal }) {
	const myFiltersIds = JSON.parse(
		storage.getString('filters:insurances:ids') || '[]',
	) as Array<string>;

	if (!myFiltersIds.length) {
		return {
			data: [],
		};
	}

	const url = new URL(`${api.config?.baseURL}/safes/simple`);

	if (myFiltersIds) {
		for (const item of myFiltersIds) {
			url.searchParams.append('ids', item);
		}
	}

	const { data } = await api.get<ResponseDataCursor<SafeSimple>>(
		url.toString(),
		{
			signal,
		},
	);

	return {
		...data,
		data: data.data
			.sort(
				(a, b) =>
					// @ts-expect-error
					endOfDay(parseISO(a.expiration)) - endOfDay(parseISO(b.expiration)),
			)
			.filter((e) => e.status === 'active')
			.filter((e) => endOfDay(parseISO(e.expiration as string)) >= new Date()),
	};
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
