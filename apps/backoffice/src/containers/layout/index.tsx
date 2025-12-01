import { SidebarInset } from '@/components/ui/sidebar';
import { SidebarProvider } from './provider';
import { Sidebar } from './sidebar';

function Layout({ children }: React.PropsWithChildren) {
	return (
		<SidebarProvider>
			<Sidebar />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}

export { Layout };
