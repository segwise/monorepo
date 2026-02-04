import { ChevronDownIcon, MoreHorizontalIcon } from 'lucide-react';
import Image from 'next/image';
import { Activity } from 'react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { placeholder } from '@/config/placeholder';
import { getSessionCache } from '@/functions/auth/get-session-cache';
import { cn } from '@/utils';
import { DropdownmenuButtonSignOut } from './sign-out';

async function DropdownMenuProfile({
	variant,
}: {
	variant: 'sidebar' | 'topbar';
}) {
	const data = await getSessionCache();

	return (
		<DropdownMenu>
			<Activity mode={variant === 'topbar' ? 'visible' : 'hidden'}>
				<DropdownMenuTrigger asChild>
					<Button variant='ghost' className='px-2'>
						<Image
							src={data?.user.image || placeholder.user}
							alt={data?.user.name || 'Imagem de perfil'}
							className='aspect-square size-8 rounded-full object-cover object-center bg-sidebar'
						/>
						<div className='text-left'>
							<span className='block text-sm dark:text-foreground font-semibold leading-none'>
								{data?.user.name}
							</span>
							<span className='block text-xs text-muted-foreground truncate whitespace-nowrap max-w-40'>
								{data?.user.email}
							</span>
						</div>
						<div>
							<ChevronDownIcon className='size-4' />
						</div>
					</Button>
				</DropdownMenuTrigger>
			</Activity>
			<Activity mode={variant === 'sidebar' ? 'visible' : 'hidden'}>
				<DropdownMenuTrigger asChild>
					<Button variant='ghost'>
						<div className='bg-muted border size-8 rounded-sm overflow-hidden'>
							<Image
								src={data?.user.image || placeholder.user}
								alt={data?.user.name || 'Imagem de perfil'}
								className='aspect-square size-full object-cover object-center'
							/>
						</div>
						<div className='grid flex-1 text-left text-sm leading-normal'>
							<span className='truncate font-semibold leading-none'>
								{data?.user.name}
							</span>
							<span className='truncate text-xs dark:text-sidebar-ring'>
								{data?.user.email}
							</span>
						</div>
						<MoreHorizontalIcon className='size-4 dark:text-sidebar-ring peer-data-[active=false]/menu-button:text-muted-foreground' />
					</Button>
				</DropdownMenuTrigger>
			</Activity>
			<DropdownMenuContent
				align={variant === 'topbar' ? 'end' : 'center'}
				className={cn('w-60', variant === 'sidebar' && 'dark')}
			>
				<Button
					variant='ghost'
					className='hover:bg-transparent active:bg-transparent cursor-default px-1'
				>
					<Image
						src={data?.user.image || placeholder.user}
						alt={data?.user.name || 'Imagem de perfil'}
						className='bg-muted border aspect-square size-8 rounded-sm object-cover object-center'
					/>
					<div className='grid flex-1 text-left text-sm leading-normal'>
						<span className='truncate font-semibold leading-none'>
							{data?.user.name}
						</span>
						<span className='truncate text-xs text-sidebar-ring mt-px'>
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
