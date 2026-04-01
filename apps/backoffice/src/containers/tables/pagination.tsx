'use client';

import { QueryObserver, useQueryClient } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
} from '@/components/ui/pagination';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSearchParams as useSearchParamsQuotes } from '@/libraries/search-params/quotes';
import { useSearchParams as useSearchParamsSafes } from '@/libraries/search-params/safes';

const queryKeys = {
	quotes: ['quotes', 'simple'],
	proposals: ['proposals', 'simple'],
	policies: ['policies', 'simple'],
};

function TablePagination({
	type,
}: {
	type: 'quotes' | 'proposals' | 'policies';
}) {
	const queryCllient = useQueryClient();

	const [searchParamsQuotes, setSearchParamsQuotes] = useSearchParamsQuotes();
	const [searchParamsSafes, setSearchParamsSafes] = useSearchParamsSafes();

	const [searchParams, setSearchParams] =
		type === 'quotes'
			? [searchParamsQuotes, setSearchParamsQuotes]
			: [searchParamsSafes, setSearchParamsSafes];

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
		const {
			basisOfAnalysis: _basisOfAnalysis,
			// @ts-expect-error
			effectived: _effectived,
			...params
		} = searchParams;

		const observer = new QueryObserver(queryCllient, {
			queryKey: [...queryKeys[type], params],
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
					cursor: query.previous || query.pages.last,
				});
			}

			// @ts-expect-error
			if (query?.total > 0 && query?.pages?.count === 1) {
				setSearchParams({
					cursor: null,
				});
			}
		});

		return unsubscribe;
	}, [queryCllient, type, searchParams, setSearchParams]);

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
						value={searchParams.limit?.toString()}
						defaultValue='10'
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
						<Button
							size='sm'
							disabled={!previous}
							onClick={() =>
								setSearchParams({
									cursor: Object.values(pages ?? {}).includes(previous)
										? previous
										: null,
								})
							}
							variant='outline'
							className='gap-1 pl-2.5'
						>
							<ChevronLeftIcon className='size-4' />
							Anterior
						</Button>
						{!Object.entries(pages ?? {}).find(([key]) => key === '1') && (
							<Button
								size='icon-sm'
								variant='outline'
								onClick={() =>
									setSearchParams({
										cursor: pages?.first,
									})
								}
							>
								1
							</Button>
						)}
						{!!Object.entries(pages ?? {}).length && <PaginationEllipsis />}
						{Object.entries(pages ?? {})
							.filter(
								([key]) => key !== 'first' && key !== 'last' && key !== 'count',
							)
							.map(([key, value]) => (
								<Button
									key={`${key}-${value}`}
									size='icon-sm'
									onClick={() =>
										setSearchParams({
											cursor: value,
										})
									}
									variant={
										searchParams.cursor === value ? 'default' : 'outline'
									}
								>
									{key}
								</Button>
							))}
						{!!Object.entries(pages ?? {}).length && <PaginationEllipsis />}
						{!Object.entries(pages ?? {}).find(
							([key]) => key === pages?.count?.toString(),
						) && (
							<Button
								size='icon-sm'
								onClick={() =>
									setSearchParams({
										cursor: pages?.last,
									})
								}
								variant='outline'
							>
								{pages?.count}
							</Button>
						)}
						<Button
							size='sm'
							disabled={!next}
							onClick={() =>
								setSearchParams({
									cursor: next,
								})
							}
							variant='outline'
							className='gap-1 pr-2.5'
						>
							Próximo
							<ChevronRightIcon className='size-4' />
						</Button>
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	);
}

export { TablePagination };
