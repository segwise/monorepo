import type { Metadata } from 'next';
import { CardActiveBrokers } from '@/cards/active-brokers';
import { CardActiveInsurance } from '@/cards/active-insurance';
import { CardInsuranceAnalysisAndQuotes } from '@/cards/insurance-analysis-and-quotes';
import { CardInsuranceThroughInsuranceCompanies } from '@/cards/insurance-through-insurance companies';
import { CardLeadsCaptured } from '@/cards/leads-captured';
import { CardOverview } from '@/cards/overview-card';
import { CardPendingQuotes } from '@/cards/pending-quotes';

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
