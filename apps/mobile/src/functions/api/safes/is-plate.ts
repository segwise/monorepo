import { api } from '@/libraries/api';
import type { QuoteSimple } from '@segwise/core';
import { SchemaPlate } from '@segwise/core/schemas';

async function isSafePlate(
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
			type: 'safe';
		}
	>(`/safes/simple/plate/${plate.replaceAll('-', '').toLowerCase()}`, {
		signal,
	});

	return data;
}

export { isSafePlate };
