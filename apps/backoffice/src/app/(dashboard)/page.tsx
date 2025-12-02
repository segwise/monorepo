import { Separator } from '@/components/ui/separator';
import { DropdownMenuProfile } from '@/containers/layout/dropdown-menu-profile';
import { SheetNotification } from '@/containers/layout/notifications';
import { TitlePage } from '@/containers/layout/title-page';

function DashboardPage() {
	return (
		<main className='p-6'>
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
		</main>
	);
}

export default DashboardPage;
