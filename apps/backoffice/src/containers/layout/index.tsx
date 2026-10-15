import { MenuIcon } from 'lucide-react';
import { ViewTransition } from 'react';
import { Button } from '@/components/ui/button';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { DropdownMenuProfile } from './dropdown-menu-profile';
import { Header } from './header';
import { SidebarProvider } from './provider';
import { Sidebar } from './sidebar';
import { TitlePage } from './title-page';

function Layout({ children }: React.PropsWithChildren) {
	return (
		<SidebarProvider>
			<Sidebar />
			<SidebarInset className='overflow-y-scroll overscroll-none h-[calc(100dvh-1rem)]'>
				<Header>
					<div className='flex flex-row items-center justify-start gap-x-2'>
						<SidebarTrigger className='sm:hidden' asChild>
							<Button variant='ghost'>
								<MenuIcon className='size-6!' />
							</Button>
						</SidebarTrigger>
						<TitlePage />
					</div>
					<div className='sm:flex hidden flex-row items-center justify-end gap-x-2'>
						<DropdownMenuProfile variant='topbar' />
					</div>
				</Header>
				<br />
				<main className='p-6 max-sm:p-3 pt-0 -mt-4 max-sm:-mt-8'>
					<ViewTransition>{children}</ViewTransition>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

export { Layout };
