import { Suspense } from 'react';
import { Layout } from '@/containers/layout';

function DashboardLayout({ children }: React.PropsWithChildren) {
	return (
		<Suspense>
			<Layout>{children}</Layout>
		</Suspense>
	);
}

export default DashboardLayout;
