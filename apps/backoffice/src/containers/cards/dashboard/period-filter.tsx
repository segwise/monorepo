'use client';

import { createContext, useContext, useMemo, useState } from 'react';

type PeriodPreset = '7d' | '30d' | 'month' | 'quarter' | 'year';
type ComparisonMode = 'yoy' | 'previous-period';

interface DateRange {
	from: Date;
	to: Date;
}

interface PeriodFilterState {
	preset: PeriodPreset;
	comparisonMode: ComparisonMode;
}

interface ResolvedPeriod {
	current: DateRange;
	reference: DateRange;
	comparisonMode: ComparisonMode;
	preset: PeriodPreset;
}

interface PeriodFilterContextValue extends PeriodFilterState {
	resolved: ResolvedPeriod;
	/** Falso quando o preset é 'year' — só existe comparação YoY nesse caso. */
	isComparisonModeSelectable: boolean;
	setPreset: (preset: PeriodPreset) => void;
	setComparisonMode: (mode: ComparisonMode) => void;
}

const PeriodFilterContext = createContext<PeriodFilterContextValue | null>(
	null,
);

function startOfMonth(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
	return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(date: Date) {
	return new Date(date.getFullYear(), 0, 1);
}

function endOfYear(date: Date) {
	return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

function subtractDays(date: Date, days: number) {
	const result = new Date(date);
	result.setDate(result.getDate() - days);
	return result;
}

function subtractYears(date: Date, years: number) {
	const result = new Date(date);
	result.setFullYear(result.getFullYear() - years);
	return result;
}

function resolveCurrentRange(preset: PeriodPreset): DateRange {
	const now = new Date();

	switch (preset) {
		case '7d':
			return { from: subtractDays(now, 7), to: now };
		case '30d':
			return { from: subtractDays(now, 30), to: now };
		case 'month':
			return { from: startOfMonth(now), to: endOfMonth(now) };
		case 'quarter': {
			const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
			const from = new Date(now.getFullYear(), quarterStartMonth, 1);
			const to = new Date(
				now.getFullYear(),
				quarterStartMonth + 3,
				0,
				23,
				59,
				59,
				999,
			);
			return { from, to };
		}
		case 'year':
			return { from: startOfYear(now), to: endOfYear(now) };
	}
}

/**
 * Resolve o range de referência (comparação).
 *
 * - yoy: mesmo intervalo, um ano atrás — regra de negócio principal, já que
 *   apólices são anuais.
 * - previous-period: para presets "rolling" (7d/30d), volta o mesmo número
 *   de dias imediatamente antes. Para presets "calendário" (month/quarter),
 *   volta para a unidade calendário anterior (mês/trimestre anterior).
 * - para preset 'year', não existe "período anterior" distinto de "ano
 *   anterior" — ambos resolvem pro mesmo cálculo (yoy). A UI nunca deveria
 *   permitir escolher 'previous-period' com preset 'year' (ver
 *   isComparisonModeSelectable), mas a função resolve com segurança de
 *   qualquer forma, caso comparisonMode fique com o valor antigo salvo.
 */
function resolveReferenceRange(
	preset: PeriodPreset,
	current: DateRange,
	comparisonMode: ComparisonMode,
): DateRange {
	if (comparisonMode === 'yoy' || preset === 'year') {
		return {
			from: subtractYears(current.from, 1),
			to: subtractYears(current.to, 1),
		};
	}

	switch (preset) {
		case 'month': {
			const previousMonthAnchor = new Date(
				current.from.getFullYear(),
				current.from.getMonth() - 1,
				1,
			);
			return {
				from: startOfMonth(previousMonthAnchor),
				to: endOfMonth(previousMonthAnchor),
			};
		}
		case 'quarter': {
			const previousQuarterAnchor = new Date(
				current.from.getFullYear(),
				current.from.getMonth() - 3,
				1,
			);
			const quarterStartMonth =
				Math.floor(previousQuarterAnchor.getMonth() / 3) * 3;
			const from = new Date(
				previousQuarterAnchor.getFullYear(),
				quarterStartMonth,
				1,
			);
			const to = new Date(
				previousQuarterAnchor.getFullYear(),
				quarterStartMonth + 3,
				0,
				23,
				59,
				59,
				999,
			);
			return { from, to };
		}
		case '7d':
		case '30d': {
			const durationMs = current.to.getTime() - current.from.getTime();
			return {
				from: new Date(current.from.getTime() - durationMs),
				to: new Date(current.from.getTime()),
			};
		}
		// case 'year':
		// 	return {
		// 		from: subtractYears(current.from, 1),
		// 		to: subtractYears(current.to, 1),
		// 	};
	}
}

function PeriodFilterProvider({ children }: { children: React.ReactNode }) {
	const [preset, setPresetState] = useState<PeriodPreset>('30d');
	const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('yoy');

	const isComparisonModeSelectable = preset !== 'year';

	const resolved = useMemo<ResolvedPeriod>(() => {
		const current = resolveCurrentRange(preset);
		const effectiveMode = isComparisonModeSelectable ? comparisonMode : 'yoy';
		const reference = resolveReferenceRange(preset, current, effectiveMode);

		return { current, reference, comparisonMode: effectiveMode, preset };
	}, [preset, comparisonMode, isComparisonModeSelectable]);

	const value = useMemo(
		() => ({
			preset,
			comparisonMode,
			resolved,
			isComparisonModeSelectable,
			setPreset: (nextPreset: PeriodPreset) => setPresetState(nextPreset),
			setComparisonMode: (mode: ComparisonMode) => setComparisonMode(mode),
		}),
		[preset, comparisonMode, resolved, isComparisonModeSelectable],
	);

	return (
		<PeriodFilterContext.Provider value={value}>
			{children}
		</PeriodFilterContext.Provider>
	);
}

function usePeriodFilter() {
	const context = useContext(PeriodFilterContext);

	if (!context) {
		throw new Error(
			'usePeriodFilter deve ser usado dentro de um PeriodFilterProvider',
		);
	}

	return context;
}

function formatDateRange(range: DateRange): string {
	const formatter = new Intl.DateTimeFormat('pt-BR', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	});

	return `${formatter.format(range.from)} – ${formatter.format(range.to)}`;
}

export { PeriodFilterProvider, usePeriodFilter, formatDateRange };
export type { PeriodPreset, ComparisonMode, DateRange, ResolvedPeriod };
