'use client';

import { ChevronDownIcon, FilterIcon, PlusIcon } from 'lucide-react';
import { InputSearch } from '@/components/input-search';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Card, CardContent } from '@/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DialogProducerPartnerRegister } from '@/containers/dialogs/producers/register';
import { DialogProducerRegisterInternal } from '@/containers/dialogs/producers/register-internal';
import { ButtonCopyProducerPublicLink } from '@/containers/producers/button-copy-public-link';
import { TablePagination } from '@/containers/tables/pagination';
import {
	TableProducersSheetFilters,
	TableProducersSheetFiltersCount,
} from '@/containers/tables/producers/filters/sheet';
import { TableProducersPending } from '@/containers/tables/producers/pending';
import { TableProducersSimple } from '@/containers/tables/producers/simple';
import { useSearchParams } from '@/libraries/search-params/producers';

function ProducersPage() {
	const [searchParams] = useSearchParams();

	const status = searchParams.status || 'active';
	const kind = searchParams.kind || 'all';

	return (
		<main className='grid grid-cols-1 gap-6 max-sm:gap-3 mt-1'>
			<div className='flex flex-row max-sm:flex-col max-sm:space-y-2 sm:items-center sm:justify-between'>
				<div className='flex flex-row items-center justify-start gap-x-2 max-sm:w-full'>
					<InputSearch className='max-sm:w-full' />
				</div>
				<div className='flex flex-row items-center sm:justify-end gap-x-2 max-sm:flex-wrap'>
					<TableProducersSheetFilters>
						<Button variant='outline' className='dark:bg-primary max-sm:flex-1'>
							<FilterIcon /> Filtrar <TableProducersSheetFiltersCount />
						</Button>
					</TableProducersSheetFilters>
					<ButtonCopyProducerPublicLink />
					<ButtonGroup>
						<DialogProducerRegisterInternal>
							<Button className='max-sm:flex-1'>
								<PlusIcon /> Cadastrar Produtor
							</Button>
						</DialogProducerRegisterInternal>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button size='icon'>
									<ChevronDownIcon />
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end'>
								<DialogProducerPartnerRegister>
									<DropdownMenuItem
										onSelect={(event) => event.preventDefault()}
									>
										<PlusIcon /> Cadastrar Parceiro
									</DropdownMenuItem>
								</DialogProducerPartnerRegister>
							</DropdownMenuContent>
						</DropdownMenu>
					</ButtonGroup>
				</div>
			</div>
			<div className='space-y-3'>
				<Card className='p-0 overflow-hidden'>
					<CardContent className='p-0'>
						{status === 'active' && <TableProducersSimple />}
						{status === 'pending' && <TableProducersPending kind={kind} />}
					</CardContent>
				</Card>
				{status === 'active' && <TablePagination type='producers' />}
			</div>
		</main>
	);
}

export default ProducersPage;
