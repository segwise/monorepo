import type { Server } from '@/@types/server.d';
import { registerRoutersServicesAnalyticsDashboardActionRequired } from './action-required';
import { registerRoutersServicesAnalyticsDashboardCanceled } from './canceled';
import { registerRoutersServicesAnalyticsDashboardConversionFunnel } from './conversion-funnel';
import { registerRoutersServicesAnalyticsDashboardFinancialSummary } from './financial-summary';
import { registerRoutersServicesAnalyticsDashboardInsuranceDistribution } from './insurance-distribution';
import { registerRoutersServicesAnalyticsDashboardMetric } from './metric';
import { registerRoutersServicesAnalyticsDashboardOperationalKpis } from './operational-kpis';
import { registerRoutersServicesAnalyticsDashboardProducersRanking } from './producers-ranking';
import { registerRoutersServicesAnalyticsDashboardProjections } from './projections';

function registerRoutersServicesAnalyticsDashboard(server: Server) {
	const base = server.basePath('/dashboard');

	registerRoutersServicesAnalyticsDashboardMetric(base);
	registerRoutersServicesAnalyticsDashboardCanceled(base);
	registerRoutersServicesAnalyticsDashboardOperationalKpis(base);
	registerRoutersServicesAnalyticsDashboardFinancialSummary(base);
	registerRoutersServicesAnalyticsDashboardConversionFunnel(base);
	registerRoutersServicesAnalyticsDashboardProducersRanking(base);
	registerRoutersServicesAnalyticsDashboardActionRequired(base);
	registerRoutersServicesAnalyticsDashboardProjections(base);
	registerRoutersServicesAnalyticsDashboardInsuranceDistribution(base);
}

export { registerRoutersServicesAnalyticsDashboard };
