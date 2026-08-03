'use client';

import type { QuoteStatus, SafeStatus } from '@segwise/core/types';
import {
	FileBadgeIcon,
	FileClockIcon,
	FileSearch2Icon,
	FileX2Icon,
	type LucideIcon,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAnalyticsStatus } from '@/libraries/hooks/analytics/use-status-analytics';
import { useSearchParams as useSearchParamsNuqs } from '@/libraries/search-params/safes';
import { CardHeaderHome } from '../../header-home';

type Type = 'quotes' | 'proposals' | 'policies';

type Status = QuoteStatus | SafeStatus;

interface CardAnalyticsStatusProps {
	title: string;
	status: Status | Array<Status>;
	type: Type;
}

const icons: Record<Status, LucideIcon> = {
	waiting: FileClockIcon,
	quoting: FileSearch2Icon,
	quoted: FileSearch2Icon,
	sent: FileSearch2Icon,
	confirmed: FileBadgeIcon,
	recused: FileX2Icon,
	canceled: FileX2Icon,
	suspended: FileClockIcon,
	active: FileBadgeIcon,
};

function CardAnalyticsStatus({
	title,
	status,
	type,
}: CardAnalyticsStatusProps) {
	const searchParams = useSearchParams();
	const [searchParamsNuqs] = useSearchParamsNuqs();

	const { data, isPending } = useAnalyticsStatus(type, {
		effectivedAt: searchParamsNuqs.effectivedAt,
		// biome-ignore lint/suspicious/noExplicitAny: any
		...(Object.fromEntries(searchParams.entries()) as any),
		status: typeof status === 'string' ? [status] : status,
	});

	const current = data?.current || 0;
	const before = data?.before || 0;

	const percent =
		(before !== 0 ? Math.round(((current - before) / before) * 100) : 0) / 100;

	return (
		<CardHeaderHome
			isPending={isPending}
			icon={icons[typeof status === 'string' ? status : status[0]]}
			title={title}
			value={current.toString()}
			before={before.toString()}
			percent={percent}
		/>
	);
}

export { CardAnalyticsStatus };
