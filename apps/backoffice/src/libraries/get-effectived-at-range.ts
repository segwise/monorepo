import { parseISO } from 'date-fns';

function toDate(value: string | Date | undefined): Date | undefined {
	if (!value) return undefined;
	return value instanceof Date ? value : parseISO(value);
}

function getEffectivedAtRange(
	effectivedAt: string | Date | { start?: string | Date; end?: string | Date },
): { start?: Date; end?: Date } {
	if (effectivedAt instanceof Date || typeof effectivedAt === 'string') {
		const date = toDate(effectivedAt);

		return { start: date, end: date };
	}

	return {
		start: toDate(effectivedAt?.start),
		end: toDate(effectivedAt?.end),
	};
}

export { getEffectivedAtRange };
