import { ViewTransition } from 'react';
import { Separator } from '@/components/ui/separator';
import { SidebarInset } from '@/components/ui/sidebar';
import { DropdownMenuProfile } from './dropdown-menu-profile';
import { SheetNotification } from './notifications';
import { SidebarProvider } from './provider';
import { Sidebar } from './sidebar';
import { TitlePage } from './title-page';

function Layout({ children }: React.PropsWithChildren) {
	return (
		<SidebarProvider>
			<Sidebar />
			<SidebarInset className='p-6'>
				<header className='flex flex-row items-center justify-between'>
					<div>
						<TitlePage />
					</div>
					<div className='flex flex-row items-center justify-end gap-x-2'>
						<SheetNotification />
						<Separator orientation='vertical' className='h-10' />
						<DropdownMenuProfile variant='topbar' />
					</div>
				</header>
				<br />
				<ViewTransition>{children}</ViewTransition>
			</SidebarInset>
		</SidebarProvider>
	);
}

export { Layout };
