'use client';

import type { QuoteStatus } from '@segwise/core/types';
import {
	FileBadgeIcon,
	FileClockIcon,
	FileSearch2Icon,
	FileX2Icon,
	type LucideIcon,
} from 'lucide-react';
import { useQuotesAnalyticsStatus } from '@/libraries/hooks/quotes/analytics/use-quotes-analytics';
import { useSearchParams } from '@/libraries/search-params/quotes';
import { CardHeaderHome } from '../header-home';

interface CardQuotesStatusAnalyticsProps {
	title: string;
	status: QuoteStatus | Array<QuoteStatus>;
}

const icons: Record<QuoteStatus, LucideIcon> = {
	waiting: FileClockIcon,
	quoting: FileSearch2Icon,
	quoted: FileSearch2Icon,
	sent: FileSearch2Icon,
	confirmed: FileBadgeIcon,
	recused: FileX2Icon,
};

function CardQuotesStatusAnalytics({
	title,
	status,
}: CardQuotesStatusAnalyticsProps) {
	const [{ cursor: _cursor, limit: _limit, ...searchParams }] =
		useSearchParams();

	const { data, isPending } = useQuotesAnalyticsStatus({
		...searchParams,
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

export { CardQuotesStatusAnalytics };
