import { MoreHorizontalIcon } from 'lucide-react';
import { cacheLife } from 'next/cache';
import { headers } from 'next/headers';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { placeholder } from '@/config/placeholder';
import { auth } from '@/libraries/auth';
import { DropdownmenuButtonSignOut } from './sign-out';

async function getInformation() {
	'use cache: private';

	cacheLife('hours');

	const headerList = await headers();

	const { data } = await auth.getSession({
		fetchOptions: {
			headers: headerList,
		},
	});

	return data;
}

async function DropdownMenuProfile() {
	const data = await getInformation();

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
						<span className='truncate text-xs text-muted-foreground/70 leading-none mt-px'>
							{data?.user.email}
						</span>
					</div>
					<MoreHorizontalIcon className='text-muted-foreground/70!' />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align='start' className='w-60'>
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
						<span className='truncate text-xs text-muted-foreground/70 leading-none mt-px'>
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
