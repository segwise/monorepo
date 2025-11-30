import { cookies } from 'next/headers';
import { use } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from './sidebar';

function Layout({ children }: React.PropsWithChildren) {
	const cookieStore = use(cookies());

	const cookie = cookieStore.get('sidebar_state')?.value;

	const defaultOpen = cookie === 'true';

	return (
		<SidebarProvider defaultOpen={!cookie ? true : defaultOpen}>
			<Sidebar />
			<SidebarInset className='light'>{children}</SidebarInset>
		</SidebarProvider>
	);
}

export { Layout };
