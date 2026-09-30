'use client';

import { ArrowUpIcon, FileTextIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { useAnalyticsStatusCount } from '@/libraries/hooks/analytics/use-status-analytics';
import { useSearchParams as useSearchParamsNuqs } from '@/libraries/search-params/safes';
import { CardHeaderHome } from '../../header-home';

type Type = 'quotes' | 'proposals';

interface CardAnalyticsStatusCountProps {
	title: string;
	type: Type;
}

function CardAnalyticsStatusCount({
	type,
	title,
}: CardAnalyticsStatusCountProps) {
	const searchParams = useSearchParams();
	const [searchParamsNuqs] = useSearchParamsNuqs();

	const { data, isPending } = useAnalyticsStatusCount(type, {
		effectivedAt: searchParamsNuqs.effectivedAt,
		// biome-ignore lint/suspicious/noExplicitAny: any
		...(Object.fromEntries(searchParams.entries()) as any),
	});

	const current = data?.current || 0;
	const before = data?.before || 0;

	const percent =
		(before !== 0 ? Math.round(((current - before) / before) * 100) : 0) / 100;

	return (
		<CardHeaderHome
			isPending={isPending}
			icon={FileTextIcon}
			title={title}
			value={current.toString()}
			before={before.toString()}
			percent={percent}
		/>
	);
}

function CardAnalyticsStatusCountList({
	type,
	title,
}: CardAnalyticsStatusCountProps) {
	const searchParams = useSearchParams();
	const [searchParamsNuqs] = useSearchParamsNuqs();

	const { data, isPending } = useAnalyticsStatusCount(type, {
		effectivedAt: searchParamsNuqs.effectivedAt,
		// biome-ignore lint/suspicious/noExplicitAny: any
		...(Object.fromEntries(searchParams.entries()) as any),
	});

	const current = data?.current || 0;
	const before = data?.before || 0;

	const percent =
		(before !== 0 ? Math.round(((current - before) / before) * 100) : 0) / 100;

	if (isPending) {
		return;
	}

	return (
		<div className='flex flex-row items-center justify-end divide-x'>
			<div className='flex flex-row items-center justify-center pr-3'>
				<div className='flex flex-row items-center justify-start gap-x-1 text-xs text-muted-foreground font-medium'>
					<FileTextIcon className='size-3' />
					Do{' '}
					{!searchParamsNuqs.basisOfAnalysis ||
					searchParamsNuqs.basisOfAnalysis === 'year'
						? 'ano'
						: 'mês'}{' '}
					anterior:{' '}
					<span className='text-sm font-bold text-foreground'>{before}</span>
				</div>
			</div>
			<div className='flex flex-row items-center justify-between pl-3'>
				<div className='flex flex-row items-center justify-center pr-3'>
					<div className='flex flex-row items-center justify-start gap-x-1 text-xs text-muted-foreground font-medium'>
						<FileTextIcon className='size-3' />
						{title}:{' '}
						<span className='text-sm font-bold text-foreground'>{current}</span>
					</div>
				</div>
				<Badge
					variant={
						percent === 0 ? 'default' : percent < 0 ? 'destructive' : 'success'
					}
				>
					<ArrowUpIcon />{' '}
					{new Intl.NumberFormat('pt-BR', { style: 'percent' }).format(percent)}
				</Badge>
			</div>
		</div>
	);
}

export { CardAnalyticsStatusCount, CardAnalyticsStatusCountList };
