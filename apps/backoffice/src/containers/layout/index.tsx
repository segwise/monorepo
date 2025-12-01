import { cacheLife } from 'next/cache';
import { cookies } from 'next/headers';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Sidebar } from './sidebar';

async function getOpenSidebar() {
	'use cache: private';
	cacheLife('max');

	const cookieStore = await cookies();

	const cookie = cookieStore.get('sidebar_state')?.value;

	const defaultOpen = cookie === 'true';

	return !cookie ? true : defaultOpen;
}

async function Layout({ children }: React.PropsWithChildren) {
	const defaultOpen = await getOpenSidebar();

	return (
		<SidebarProvider defaultOpen={defaultOpen}>
			<Sidebar />
			<SidebarInset className='light'>{children}</SidebarInset>
		</SidebarProvider>
	);
}

export { Layout };
