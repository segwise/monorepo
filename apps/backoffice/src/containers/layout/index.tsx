import { Suspense } from 'react';
import { SidebarInset } from '@/components/ui/sidebar';
import { SidebarProvider } from './provider';
import { Sidebar } from './sidebar';

function Layout({ children }: React.PropsWithChildren) {
	return (
		<Suspense>
			<SidebarProvider>
				<Sidebar />
				<SidebarInset>{children}</SidebarInset>
			</SidebarProvider>
		</Suspense>
	);
}

export { Layout };
