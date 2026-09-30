import type { Metadata } from 'next';
import { CardOverview } from '@/cards/overview-card';
import { CardActionRequired } from '@/containers/cards/dashboard/action-required';
import { CardCanceled } from '@/containers/cards/dashboard/canceled';
import { CardConversionFunnel } from '@/containers/cards/dashboard/conversion-funnel';
import { CardFinancialSummary } from '@/containers/cards/dashboard/financial-summary';
import { CardInsuranceComparisonCommission } from '@/containers/cards/dashboard/insurance-comparison-commission';
import { CardInsuranceComparisonNetPremium } from '@/containers/cards/dashboard/insurance-comparison-net-premium';
import { CardInsuranceComparisonPolicies } from '@/containers/cards/dashboard/insurance-comparison-policies';
import { CardInsuranceComparisonQuotes } from '@/containers/cards/dashboard/insurance-comparison-quotes';
import { CardInsuranceThroughInsuranceCompanies } from '@/containers/cards/dashboard/insurance-through-insurance-companies';
import { CardKpiAverageTicket } from '@/containers/cards/dashboard/kpi-average-ticket';
import { CardKpiClosingTime } from '@/containers/cards/dashboard/kpi-closing-time';
import { CardKpiCommission } from '@/containers/cards/dashboard/kpi-commission';
import { CardKpiConversionRate } from '@/containers/cards/dashboard/kpi-conversion-rate';
import { CardKpiForecastedCommission } from '@/containers/cards/dashboard/kpi-forecasted-commission';
import { CardKpiNetPremium } from '@/containers/cards/dashboard/kpi-net-premium';
import { CardKpiPoliciesCount } from '@/containers/cards/dashboard/kpi-policies-count';
import { CardKpiQuotesCount } from '@/containers/cards/dashboard/kpi-quotes-count';
import { CardNextPeriodProjection } from '@/containers/cards/dashboard/next-period-projection';
import { PeriodFilterProvider } from '@/containers/cards/dashboard/period-filter';
import { CardProducersRanking } from '@/containers/cards/dashboard/producers-ranking';
import { CardYearlyProjection } from '@/containers/cards/dashboard/yearly-projection';

export const metadata: Metadata = {
	title: 'Dashboard',
};

function DashboardPage() {
	return (
		<PeriodFilterProvider>
			<main className='grid gap-4'>
				<CardOverview />

				<CardActionRequired />

				<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
					<CardKpiPoliciesCount />
					<CardKpiNetPremium />
					<CardKpiQuotesCount />
					<CardKpiCommission />
				</div>

				<div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
					<CardKpiConversionRate />
					<CardKpiAverageTicket />
					<CardKpiClosingTime />
					<CardKpiForecastedCommission />
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<CardInsuranceComparisonPolicies />
					<CardInsuranceComparisonNetPremium />
					<CardInsuranceComparisonQuotes />
					<CardInsuranceComparisonCommission />
				</div>

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<CardYearlyProjection />
					<CardNextPeriodProjection />
				</div>

				<CardFinancialSummary />

				<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
					<CardProducersRanking />
					<CardConversionFunnel />
				</div>

				<CardInsuranceThroughInsuranceCompanies />

				<CardCanceled />
			</main>
		</PeriodFilterProvider>
	);
}

export default DashboardPage;
