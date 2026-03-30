'use client';

import { HomeIcon } from 'lucide-react';
import { useState } from 'react';
import { useQuotesAnalyticsCount } from '@/libraries/hooks/quotes/analytics/use-quotes-analytics';
import { useSearchParams } from '@/libraries/search-params/quotes';
import { CardHeaderHome } from '../header-home';

interface CardQuotesCountAnalyticsProps {
	title: string;
}

function CardQuotesCountAnalytics({ title }: CardQuotesCountAnalyticsProps) {
	const [searchParams] = useSearchParams();

	const [type, setType] = useState<'year' | 'month'>('year');

	const { data, isPending } = useQuotesAnalyticsCount({
		...searchParams,
		type,
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
			before={before.toString()}
			percent={percent}
			type={type}
			setType={setType}
		/>
	);
}

export { CardQuotesCountAnalytics };
