import { MoreHorizontalIcon } from 'lucide-react';
import Image from 'next/image';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { placeholder } from '@/config/placeholder';
import { getSessionCache } from '@/functions/auth/get-session-cache';
import { DropdownmenuButtonSignOut } from './sign-out';

function DropdownMenuProfile() {
	const data = use(getSessionCache());

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost'>
					<Image
						src={data?.user.image || placeholder.user}
						alt={data?.user.name as string}
						className='bg-muted border aspect-square size-8 rounded-sm object-cover object-center'
					/>
					<div className='grid flex-1 text-left text-sm leading-normal'>
						<span className='truncate font-semibold leading-none'>
							{data?.user.name}
						</span>
						<span className='truncate text-xs dark:text-sidebar-ring leading-none mt-px'>
							{data?.user.email}
						</span>
					</div>
					<MoreHorizontalIcon className='dark:text-sidebar-ring!' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start' className='w-60 dark'>
				<Button
					variant='ghost'
					className='hover:bg-transparent active:bg-transparent cursor-default px-1'
				>
					<Image
						src={data?.user.image || placeholder.user}
						alt={data?.user.name as string}
						className='bg-muted border aspect-square size-8 rounded-sm object-cover object-center'
					/>
					<div className='grid flex-1 text-left text-sm leading-normal'>
						<span className='truncate font-semibold leading-none'>
							{data?.user.name}
						</span>
						<span className='truncate text-xs dark:text-sidebar-ring leading-none mt-px'>
							{data?.user.email}
						</span>
					</div>
				</Button>
				<DropdownMenuSeparator />
				<DropdownmenuButtonSignOut />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { DropdownMenuProfile };
