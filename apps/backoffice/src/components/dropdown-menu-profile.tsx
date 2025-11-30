import { MoreHorizontalIcon } from 'lucide-react';
import { headers } from 'next/headers';
import Image from 'next/image';
import { use } from 'react';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
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
			<DropdownMenuContent align='start'>
				<DropdownMenuItem>fsdfdsf</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

export { DropdownMenuProfile };
