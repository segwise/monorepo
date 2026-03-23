import { ViewTransition } from 'react';
import { Separator } from '@/components/ui/separator';
import { SidebarInset } from '@/components/ui/sidebar';
// import { ChangeTheme } from './change-theme';
import { DropdownMenuProfile } from './dropdown-menu-profile';
import { Header } from './header';
import { SheetNotification } from './notifications';
import { SidebarProvider } from './provider';
import { Sidebar } from './sidebar';
import { TitlePage } from './title-page';

function Layout({ children }: React.PropsWithChildren) {
	return (
		<SidebarProvider>
			<Sidebar />
			<SidebarInset className='overflow-y-scroll overscroll-none h-[calc(100dvh-1rem)]'>
				<Header>
					<div>
						<TitlePage />
					</div>
					<div className='flex flex-row items-center justify-end gap-x-2'>
						{/*
							<div className='mr-2'>
								<Timer />
							</div>
						*/}
						{/* <Separator orientation='vertical' className='h-6' /> */}
						{/* <ChangeTheme /> */}
						{/* <Separator orientation='vertical' className='h-6' /> */}
						<SheetNotification />
						<Separator orientation='vertical' className='h-6' />
						<DropdownMenuProfile variant='topbar' />
					</div>
				</Header>
				<br />
				<main className='p-6 pt-0 -mt-4'>
					<ViewTransition>{children}</ViewTransition>
				</main>
			</SidebarInset>
		</SidebarProvider>
	);
}

export { Layout };
