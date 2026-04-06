import type { Metadata } from 'next';
import { CardOverview } from '@/cards/overview-card';
import { CardActiveBrokers } from '@/containers/cards/dashboard/active-brokers';
import { CardActiveInsurance } from '@/containers/cards/dashboard/active-insurance';
import { CardInsuranceAnalysisAndQuotes } from '@/containers/cards/dashboard/insurance-analysis-and-quotes';
import { CardInsuranceThroughInsuranceCompanies } from '@/containers/cards/dashboard/insurance-through-insurance companies';
import { CardLeadsCaptured } from '@/containers/cards/dashboard/leads-captured';
import { CardPendingQuotes } from '@/containers/cards/dashboard/pending-quotes';

export const metadata: Metadata = {
	title: 'Dashboard',
};

function DashboardPage() {
	return (
		<main className='grid gap-4'>
			<CardOverview />
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
				<CardActiveBrokers />
				<CardLeadsCaptured />
				<CardPendingQuotes />
				<CardActiveInsurance />
			</div>
			<div className='grid grid-cols-1 md:grid-cols-[70%_auto] gap-4'>
				<CardInsuranceAnalysisAndQuotes />
				<CardInsuranceThroughInsuranceCompanies />
			</div>
		</main>
	);
}

export default DashboardPage;
