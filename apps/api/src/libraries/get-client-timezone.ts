import type { Context } from '@/@types/server';

function getClientTimezone(ctx: Context): string {
	const tz =
		ctx.req.raw.headers.get('x-timezone') ??
		ctx.req.raw.headers.get('cf-timezone');

	if (!tz) {
		return 'UTC';
	}

	try {
		Intl.DateTimeFormat(undefined, { timeZone: tz });

		return tz;
	} catch {
		return 'UTC';
	}
}

export { getClientTimezone };
