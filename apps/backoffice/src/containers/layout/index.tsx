import { use } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { getSidebarStatusCache } from '@/functions/sidebar/get-status-cache';
import { Sidebar } from './sidebar';

function Layout({ children }: React.PropsWithChildren) {
	const defaultOpen = use(getSidebarStatusCache());

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<Sidebar />
			<SidebarInset className='light'>{children}</SidebarInset>
		</SidebarProvider>
	);
}

export { Layout };
