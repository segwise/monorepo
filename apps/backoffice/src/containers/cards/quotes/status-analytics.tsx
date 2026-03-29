'use client';

import type { QuoteStatus } from '@segwise/core/types';
import { HomeIcon } from 'lucide-react';
import { useState } from 'react';
import { useQuotesAnalyticsStatus } from '@/libraries/hooks/quotes/analytics/use-quotes-analytics';
import { useSearchParams } from '@/libraries/search-params/quotes';
import { CardHeaderHome } from '../header-home';

interface CardQuotesStatusAnalyticsProps {
	title: string;
	status: QuoteStatus | Array<QuoteStatus>;
}

function CardQuotesStatusAnalytics({
	title,
	status,
}: CardQuotesStatusAnalyticsProps) {
	const [searchParams] = useSearchParams();

	const [type, setType] = useState<'year' | 'month'>('year');

	const { data, isPending } = useQuotesAnalyticsStatus({
		...searchParams,
		type,
		status: typeof status === 'string' ? [status] : status,
	});

	const current = data?.current || 0;
	const before = data?.before || 0;

	const percent =
		(before !== 0 ? Math.round(((current - before) / before) * 100) : 0) / 100;

	return (
		<CardHeaderHome
			isPending={isPending}
			icon={HomeIcon}
			title={title}
			value={current.toString()}
			percent={percent}
			type={type}
			setType={setType}
		/>
	);
}

export { CardQuotesStatusAnalytics };
