import { formatInTimeZone, fromZonedTime } from 'date-fns-tz';

type DayRange = {
	fromKey: string;
	toKey: string;
	days: string[];
	// Colunas @db.Date (effectivedAt, expiration) ficam gravadas em UTC 00:00.
	dateFrom: Date;
	dateTo: Date;
	// Colunas timestamptz (requestedAt, statusAt...) respeitam o fuso do usuário.
	tsFrom: Date;
	tsTo: Date;
};

function dayKey(date: Date, timezone: string) {
	return formatInTimeZone(date, timezone, 'yyyy-MM-dd');
}

function listDays(fromKey: string, toKey: string) {
	const days: string[] = [];
	const cursor = new Date(`${fromKey}T00:00:00.000Z`);
	const end = new Date(`${toKey}T00:00:00.000Z`);

	while (cursor <= end) {
		days.push(cursor.toISOString().slice(0, 10));
		cursor.setUTCDate(cursor.getUTCDate() + 1);
	}

	return days;
}

function buildRange(from: Date, to: Date, timezone: string): DayRange {
	const fromKey = dayKey(from, timezone);
	const toKey = dayKey(to, timezone);

	return {
		fromKey,
		toKey,
		days: listDays(fromKey, toKey),
		dateFrom: new Date(`${fromKey}T00:00:00.000Z`),
		dateTo: new Date(`${toKey}T00:00:00.000Z`),
		tsFrom: fromZonedTime(`${fromKey}T00:00:00.000`, timezone),
		tsTo: fromZonedTime(`${toKey}T23:59:59.999`, timezone),
	};
}

function percentChange(current: number, reference: number) {
	return reference === 0 ? 0 : (current - reference) / reference;
}

export { buildRange, type DayRange, dayKey, percentChange };
