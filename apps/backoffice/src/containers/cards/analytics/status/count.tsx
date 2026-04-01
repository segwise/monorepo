'use client';

import { FileTextIcon } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useAnalyticsStatusCount } from '@/libraries/hooks/analytics/use-status-analytics';
import { CardHeaderHome } from '../../header-home';

type Type = 'quotes' | 'safes';

interface CardAnalyticsStatusCountProps {
	title: string;
	type: Type;
}

function CardAnalyticsStatusCount({
	type,
	title,
}: CardAnalyticsStatusCountProps) {
	const searchParams = useSearchParams();

	const { data, isPending } = useAnalyticsStatusCount(
		type,
		// biome-ignore lint/suspicious/noExplicitAny: any
		Object.fromEntries(searchParams.entries()) as any,
	);

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

export { CardAnalyticsStatusCount };
