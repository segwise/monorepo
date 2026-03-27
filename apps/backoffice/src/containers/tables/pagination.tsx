'use client';

import { QueryObserver, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
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
import { useSearchParams } from '@/libraries/search-params/quotes';

function TablePagination({ queryKey }: { queryKey: ['quotes', 'simple'] }) {
	const queryCllient = useQueryClient();

	const [searchParams, setSearchParams] = useSearchParams();

	const [{ total, previous, next, pages }, setState] = useState<{
		total: number;
		previous: string | null;
		next: string | null;
		pages: Record<number | 'first' | 'last' | 'count', string | null> | null;
	}>({
		total: 0,
		previous: null,
		next: null,
		pages: null,
	});

	useEffect(() => {
		const observer = new QueryObserver(queryCllient, {
			queryKey: [...queryKey, searchParams],
		});

		const unsubscribe = observer.subscribe((state) => {
			const query = state.data;

			if (!query) {
				return;
			}

			setState({
				// @ts-expect-error
				total: query.total,
				// @ts-expect-error
				previous: query.previous,
				// @ts-expect-error
				next: query.next,
				// @ts-expect-error
				pages: query.pages,
			});

			// @ts-expect-error
			if (query?.total > 0 && query?.data?.length === 0) {
				setSearchParams({
					// @ts-expect-error
					cursor: query.pages.last,
				});
			}
		});

		return unsubscribe;
	}, [queryCllient, queryKey, searchParams, setSearchParams]);

	return (
		<div className='flex flex-row items-center justify-between **:gap-x-2'>
			<div>
				<span className='text-sm px-2 text-muted-foreground flex flex-row items-center justify-start'>
					Total: {total} registros
				</span>
			</div>
			<div className='flex flex-row items-center justify-end'>
				<div className='flex flex-row items-center justify-end gap-x-1'>
					<span className='text-sm font-normal leading-none text-muted-foreground'>
						Registros:
					</span>
					<Select
						value={searchParams.limit.toString()}
						onValueChange={(value) =>
							setSearchParams({
								limit: Number(value),
							})
						}
						disabled={!total}
					>
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
						<PaginationPrevious
							size='sm'
							aria-disabled={!previous}
							href='#'
							onClick={() =>
								setSearchParams({
									// @ts-expect-error
									cursor: Object.values(pages).includes(previous)
										? previous
										: null,
								})
							}
						/>
						{!Object.entries(pages ?? {}).find(([key]) => key === '1') && (
							<PaginationLink
								href='#'
								size='icon-sm'
								onClick={() =>
									setSearchParams({
										cursor: pages?.first,
									})
								}
							>
								1
							</PaginationLink>
						)}
						{!!Object.entries(pages ?? {}).length && <PaginationEllipsis />}
						{Object.entries(pages ?? {})
							.filter(
								([key]) => key !== 'first' && key !== 'last' && key !== 'count',
							)
							.map(([key, value]) => (
								<PaginationLink
									key={`${key}-${value}`}
									href='#'
									size='icon-sm'
									onClick={() =>
										setSearchParams({
											cursor: value,
										})
									}
									isActive={searchParams.cursor === value}
								>
									{key}
								</PaginationLink>
							))}
						{!!Object.entries(pages ?? {}).length && <PaginationEllipsis />}
						{!Object.entries(pages ?? {}).find(
							([key]) => key === pages?.count?.toString(),
						) && (
							<PaginationLink
								href='#'
								size='icon-sm'
								onClick={() =>
									setSearchParams({
										cursor: pages?.last,
									})
								}
							>
								{pages?.count}
							</PaginationLink>
						)}
						<PaginationNext
							size='sm'
							aria-disabled={!next}
							href='#'
							onClick={() =>
								setSearchParams({
									cursor: next,
								})
							}
						/>
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	);
}

export { TablePagination };
