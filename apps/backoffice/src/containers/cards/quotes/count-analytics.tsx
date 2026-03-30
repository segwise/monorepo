'use client';

import { FileTextIcon } from 'lucide-react';
import { useQuotesAnalyticsCount } from '@/libraries/hooks/quotes/analytics/use-quotes-analytics';
import { useSearchParams } from '@/libraries/search-params/quotes';
import { CardHeaderHome } from '../header-home';

interface CardQuotesCountAnalyticsProps {
	title: string;
}

function CardQuotesCountAnalytics({ title }: CardQuotesCountAnalyticsProps) {
	const [searchParams] = useSearchParams();

	const { data, isPending } = useQuotesAnalyticsCount({
		...searchParams,
		type: searchParams.basisOfAnalysis,
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

export { CardQuotesCountAnalytics };
