import { Suspense } from 'react';
import { SidebarProvider as ProviderUI } from '@/components/ui/sidebar';
import { getSidebarStatusCache } from '@/functions/sidebar/get-status-cache';

function SidebarProvider({ children }: React.PropsWithChildren) {
	return (
		<Suspense>
			<Provider>{children}</Provider>
		</Suspense>
	);
}

async function Provider({ children }: React.PropsWithChildren) {
	const defaultOpen = await getSidebarStatusCache();

	return <ProviderUI defaultOpen={defaultOpen}>{children}</ProviderUI>;
}

export { SidebarProvider };
