'use client';

import { SaveIcon, XCircleIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from '@/components/ui/sheet';
import { useMarketingTemplates } from '@/libraries/hooks/marketing/use-marketing';
import { useCampaignSearchParams } from '@/libraries/search-params/marketing';
import { FilterBadge } from './filter-badge';

type Status = 'all' | 'active' | 'paused';
type Frequency = 'all' | 'daily' | 'monthly';

function MarketingCampaignFilters({ children }: React.PropsWithChildren) {
	const [open, setOpen] = useState<boolean>(false);
	const [searchParams, setSearchParams] = useCampaignSearchParams();
	const { data: templates = [] } = useMarketingTemplates();

	const defaults = {
		status: (searchParams.status || 'all') as Status,
		frequency: (searchParams.frequency || 'all') as Frequency,
		template: searchParams.template || 'all',
	};

	const [status, setStatus] = useState<Status>(defaults.status);
	const [frequency, setFrequency] = useState<Frequency>(defaults.frequency);
	const [template, setTemplate] = useState<string>(defaults.template);

	function onReset() {
		setStatus(defaults.status);
		setFrequency(defaults.frequency);
		setTemplate(defaults.template);
	}

	function onChangeOpen(next: boolean) {
		setOpen(next);

		if (!next) {
			onReset();
		}
	}

	function onApply() {
		setSearchParams({
			status: status === 'all' ? null : status,
			frequency: frequency === 'all' ? null : frequency,
			template: template === 'all' ? null : template,
		});

		setOpen(false);
	}

	function onClear() {
		setSearchParams({ status: null, frequency: null, template: null });
		setOpen(false);
	}

	// biome-ignore lint/correctness/useExhaustiveDependencies: useEffect
	useEffect(() => {
		onReset();
	}, [searchParams]);

	return (
		<Sheet open={open} onOpenChange={onChangeOpen} modal={false}>
			<SheetTrigger asChild>{children}</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle>Filtrar Campanhas</SheetTitle>
					<SheetDescription>Consulta avançada de registros</SheetDescription>
				</SheetHeader>
				<Separator />
				<div className='px-4 space-y-3 overflow-auto'>
					<Field>
						<FieldLabel>Status</FieldLabel>
						<div className='flex flex-wrap gap-1.5'>
							<FilterBadge
								active={status === 'all'}
								onClick={() => setStatus('all')}
							>
								Todas
							</FilterBadge>
							<FilterBadge
								active={status === 'active'}
								onClick={() => setStatus('active')}
							>
								Ativas
							</FilterBadge>
							<FilterBadge
								active={status === 'paused'}
								onClick={() => setStatus('paused')}
							>
								Pausadas
							</FilterBadge>
						</div>
					</Field>
					<Field>
						<FieldLabel>Frequência</FieldLabel>
						<div className='flex flex-wrap gap-1.5'>
							<FilterBadge
								active={frequency === 'all'}
								onClick={() => setFrequency('all')}
							>
								Todas
							</FilterBadge>
							<FilterBadge
								active={frequency === 'daily'}
								onClick={() => setFrequency('daily')}
							>
								Diária
							</FilterBadge>
							<FilterBadge
								active={frequency === 'monthly'}
								onClick={() => setFrequency('monthly')}
							>
								Mensal
							</FilterBadge>
						</div>
					</Field>
					<Field>
						<FieldLabel>Modelo do e-mail</FieldLabel>
						<div className='flex flex-wrap gap-1.5'>
							<FilterBadge
								active={template === 'all'}
								onClick={() => setTemplate('all')}
							>
								Todos
							</FilterBadge>
							{templates.map((item) => (
								<FilterBadge
									key={item.value}
									active={template === item.value}
									onClick={() => setTemplate(item.value)}
								>
									{item.label}
								</FilterBadge>
							))}
						</div>
					</Field>
				</div>
				<SheetFooter>
					<Button onClick={onApply}>
						Aplicar <SaveIcon />
					</Button>
					<Button variant='outline' onClick={onClear}>
						Limpar filtros
					</Button>
					<SheetClose asChild>
						<Button variant='destructive'>
							Fechar <XCircleIcon />
						</Button>
					</SheetClose>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}

function MarketingCampaignFiltersCount() {
	const [searchParams] = useCampaignSearchParams();

	const count = [
		searchParams.status,
		searchParams.frequency,
		searchParams.template,
	].filter(Boolean).length;

	if (!count) {
		return;
	}

	return (
		<Badge
			variant='active'
			className='size-4 text-[0.6rem] items-center justify-center pointer-events-none'
		>
			{count}
		</Badge>
	);
}

export { MarketingCampaignFilters, MarketingCampaignFiltersCount };
