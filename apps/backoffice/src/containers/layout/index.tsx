import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

async function Layout({ children }: React.PropsWithChildren) {
	const cookieStore = await cookies();
	const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<AppSidebar />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}

export { Layout };
