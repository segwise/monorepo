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
import { cn } from '@/libraries/utils';
import { DropdownmenuButtonSignOut } from './sign-out';

function DropdownMenuProfile({ children }: React.PropsWithChildren) {
	const data = use(getSessionCache());

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				{children || (
					<Button variant='ghost'>
						<div className='bg-muted border size-8 rounded-sm overflow-hidden'>
							<Image
								src={data?.user.image || placeholder.user}
								alt={data?.user.name as string}
								className='aspect-square size-full object-cover object-center'
							/>
						</div>
						<div className='grid flex-1 text-left text-sm leading-normal'>
							<span className='truncate font-semibold leading-none'>
								{data?.user.name}
							</span>
							<span className='truncate text-xs dark:text-sidebar-ring leading-none mt-px'>
								{data?.user.email}
							</span>
						</div>
						<MoreHorizontalIcon className='size-4 dark:text-sidebar-ring peer-data-[active=false]/menu-button:text-red-500!' />
					</Button>
				)}
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align='start'
				className={cn('w-60', !children && 'dark')}
			>
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
