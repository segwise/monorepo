import { SchemaPlate } from '@segwise/core/schemas';
import type { QuoteSimple } from '@segwise/core/types';
import { api } from '@/libraries/api';

async function isQuotePlate(
	plate: string,
	{
		signal,
	}: {
		signal: AbortSignal;
	},
) {
	if (!SchemaPlate.safeParse(plate).success) {
		return null;
	}

	const { data } = await api.get<
		QuoteSimple & {
			type: 'quote';
		}
	>(`/quotes/simple/plate/${plate.replaceAll('-', '').toLowerCase()}`, {
		signal,
	});

	return data;
}

export { isQuotePlate };
