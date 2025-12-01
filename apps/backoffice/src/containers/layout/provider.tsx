import { SidebarProvider as Provider } from '@/components/ui/sidebar';
import { getSidebarStatusCache } from '@/functions/sidebar/get-status-cache';

async function SidebarProvider({ children }: React.PropsWithChildren) {
	const defaultOpen = await getSidebarStatusCache();

	return <Provider defaultOpen={defaultOpen}>{children}</Provider>;
}

export { SidebarProvider };
