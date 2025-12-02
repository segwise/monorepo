import { ChevronDownIcon } from 'lucide-react';
import Image from 'next/image';
import { DropdownMenuProfile } from '@/components/dropdown-menu-profile';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { placeholder } from '@/config/placeholder';
import { SheetNotification } from '@/containers/layout/notifications';

function DashboardPage() {
	return (
		<main className='p-6'>
			<header className='flex flex-row items-center justify-between'>
				<div>
					<h1 className='text-2xl font-semibold'>Dashboard</h1>
				</div>
				<div className='flex flex-row items-center justify-end gap-x-2'>
					<SheetNotification />
					<Separator orientation='vertical' className='h-10' />
					<DropdownMenuProfile>
						<Button variant='ghost' className='px-2'>
							<Image
								src={placeholder.user}
								className='aspect-square size-8 rounded-full object-cover object-center bg-primary'
								alt='Perfil'
							/>
							<div className='text-left'>
								<span className='block text-sm font-semibold leading-none'>
									Luis Claudio
								</span>
								<span className='block text-xs text-muted-foreground truncate whitespace-nowrap max-w-40 leading-none mt-1'>
									juniormelo271101@icloud.com
								</span>
							</div>
							<div>
								<ChevronDownIcon className='size-4' />
							</div>
						</Button>
					</DropdownMenuProfile>
				</div>
			</header>
		</main>
	);
}

export default DashboardPage;
