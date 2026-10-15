import type { ResolvedPeriod } from '@/containers/cards/dashboard/period-filter';

function periodParams(period: ResolvedPeriod) {
	return {
		from: period.current.from.toISOString(),
		to: period.current.to.toISOString(),
		refFrom: period.reference.from.toISOString(),
		refTo: period.reference.to.toISOString(),
	};
}

function periodKey(period: ResolvedPeriod) {
	return [
		period.preset,
		period.comparisonMode,
		period.current.from.toISOString(),
		period.current.to.toISOString(),
	];
}

export { periodKey, periodParams };
