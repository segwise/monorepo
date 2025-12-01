import { LogOutIcon, MoreHorizontalIcon } from 'lucide-react';
import { headers } from 'next/headers';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { placeholder } from '@/config/placeholder';
import { auth } from '@/libraries/auth';

function DropdownMenuProfile() {
	const headerList = use(headers());

	const { data } = use(
		auth.getSession({
			fetchOptions: {
				headers: headerList,
			},
		}),
	);

	const handleSignOut = async () => {
		'use server';

		const { data } = await auth.signOut({
			fetchOptions: {
				headers: headerList,
			},
		});

		if (data?.success) {
			redirect('/sign-in');
		}
	};

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
				<form action={handleSignOut}>
					<DropdownMenuItem variant='destructive' asChild>
						<Button type='submit' className='w-full h-8! justify-start'>
							<LogOutIcon />
							<span>Deslogar</span>
						</Button>
					</DropdownMenuItem>
				</form>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { DropdownMenuProfile };
