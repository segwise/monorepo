'use client';

import { QueryObserver, useQueryClient } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pagination, PaginationContent } from '@/components/ui/pagination';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useSearchParams as useSearchParamsPayments } from '@/libraries/search-params/payments';
import { useSearchParams as useSearchParamsProducers } from '@/libraries/search-params/producers';
import { useSearchParams as useSearchParamsQuotes } from '@/libraries/search-params/quotes';
import { useSearchParams as useSearchParamsSafes } from '@/libraries/search-params/safes';

const queryKeys = {
	quotes: ['quotes', 'simple'],
	proposals: ['proposals', 'simple'],
	'payments-cash-flow': ['payments', 'simple', 'cash-flow'],
	producers: ['producers', 'simple'],
} as const;

function TablePagination({ type }: { type: keyof typeof queryKeys }) {
	const queryCllient = useQueryClient();

	const [searchParamsQuotes, setSearchParamsQuotes] = useSearchParamsQuotes();
	const [searchParamsSafes, setSearchParamsSafes] = useSearchParamsSafes();
	const [searchParamsPayments, setSearchParamsPayments] =
		useSearchParamsPayments();
	const [searchParamsProducers, setSearchParamsProducers] =
		useSearchParamsProducers();

	const [searchParams, setSearchParams] =
		type === 'quotes'
			? [searchParamsQuotes, setSearchParamsQuotes]
			: type === 'proposals'
				? [searchParamsSafes, setSearchParamsSafes]
				: type === 'payments-cash-flow'
					? [searchParamsPayments, setSearchParamsPayments]
					: [searchParamsProducers, setSearchParamsProducers];

	const [{ total, previous, next }, setState] = useState<{
		total: number;
		previous: string | null;
		next: string | null;
	}>({
		total: 0,
		previous: null,
		next: null,
	});

	useEffect(() => {
		const {
			// @ts-expect-error
			basisOfAnalysis: _basisOfAnalysis,
			// "status" sai sempre daqui: nos produtores é só a aba
			// Ativos/Pendentes da página (não vai pra API, ver
			// TableProducersSimple); nas outras telas onde é um filtro real
			// (ex.: safes), é adicionado de volta logo abaixo.
			status: _status,
			...rest
		} = searchParams;

		const params =
			type === 'producers' ? rest : { ...rest, status: searchParams.status };

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
		<div className='flex flex-row max-sm:flex-col sm:items-center sm:justify-between **:gap-x-2 max-sm:space-y-2'>
			<div>
				<span className='text-sm sm:px-2 text-muted-foreground flex flex-row items-center justify-start'>
					Total: {total} registros
				</span>
			</div>
			<div className='flex flex-col sm:flex-row sm:items-center sm:justify-end'>
				<div className='max-sm:hidden flex flex-row items-center justify-end gap-x-1'>
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
				<Separator orientation='vertical' className='h-7 mx-2 max-sm:hidden' />
				<Pagination className='max-sm:w-full'>
					<PaginationContent className='max-sm:w-full'>
						<Button
							size='sm'
							disabled={previous === undefined}
							onClick={() =>
								setSearchParams({
									cursor: previous || null,
								})
							}
							variant='outline'
							className='gap-1 pl-2.5 max-sm:flex-1'
						>
							<ChevronLeftIcon className='size-4' />
							Anterior
						</Button>
						<Button
							size='sm'
							disabled={!next}
							onClick={() =>
								setSearchParams({
									cursor: next,
								})
							}
							variant='outline'
							className='gap-1 pr-2.5 max-sm:flex-1'
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
