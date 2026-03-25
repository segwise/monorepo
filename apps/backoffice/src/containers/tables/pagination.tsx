import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from '@/components/ui/pagination';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';

function TablePagination() {
	return (
		<div className='flex flex-row items-center justify-between **:gap-x-2'>
			<div>
				<span className='text-sm px-2 text-muted-foreground'>
					Total: 10 registros
				</span>
			</div>
			<div className='flex flex-row items-center justify-end'>
				<div className='flex flex-row items-center justify-end gap-x-1'>
					<span className='text-sm font-normal leading-none text-muted-foreground'>
						Registros:
					</span>
					<Select defaultValue='10'>
						<SelectTrigger className='h-9'>
							<SelectValue />
						</SelectTrigger>
						<SelectContent align='center'>
							{[10, 20, 30, 40, 50, 100].map((item, index) => (
								<SelectItem value={item.toString()} key={index.toString()}>
									{item}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<Separator orientation='vertical' className='h-7 mx-2' />
				<Pagination>
					<PaginationContent>
						<PaginationPrevious size='sm' />
						<PaginationEllipsis />
						<PaginationLink size='icon-sm'>1</PaginationLink>
						<PaginationLink size='icon-sm'>2</PaginationLink>
						<PaginationLink size='icon-sm'>3</PaginationLink>
						<PaginationEllipsis />
						<PaginationNext size='sm' />
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	);
}

export { TablePagination };
