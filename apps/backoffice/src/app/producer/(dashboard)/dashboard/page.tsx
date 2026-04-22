'use client';

import { maskPlate, maskPostalCode } from '@segwise/core/masks';
import { translateQuoteStatus } from '@segwise/core/translate';
import type { QuoteStatus } from '@segwise/core/types';
import { capitalizeFirstLetters } from '@segwise/core/utils';
import { isPlate } from '@segwise/core/valids';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import {
	ArrowUpRightIcon,
	Building2Icon,
	CalendarCheck,
	ChevronLeft,
	ChevronRight,
	ChevronRightIcon,
	Clock,
	CopyIcon,
	Eye,
	EyeOff,
	FileIcon,
	Loader2Icon,
	LogOut,
	User2Icon,
	X,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Empty,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/libraries/api';
import { auth } from '@/libraries/auth';
import { useSignOut } from '@/libraries/hooks/auth/use-sign-out';

type Insurance = {
	id: string;
	client: string;
	type: string;
	netPremium: number;
	commission: number;
	issueDate: string;
	cep?: string;
	state?: string;
	status?: QuoteStatus;
};

type Period = {
	label: string;
	month: number;
	year: number;
	totalInsurances: number;
	netPremium: number;
	totalCommission: number;
	commissionRate: number;
	goalPremium: number;
	vsLastMonth: number;
	paid: boolean;
	paidDate?: string;
	paymentDate?: string;
	commission: number;
	insurances: Insurance[];
	quotes: Insurance[];
};

type CepGroup = {
	cep: string;
	state: string;
	count: number;
	commission: number;
	insurances: Insurance[];
};

function ProducerDashboard() {
	const { replace } = useRouter();

	const [hidden, setHidden] = useState(true);

	const [periodIdx, setPeriodIdx] = useState(0);

	const [showAllQuotes, setShowAllQuotes] = useState(false);
	const [showAllInsurances, setShowAllInsurances] = useState(false);
	const [selectedCep, setSelectedCep] = useState<{
		cep: string;
		state: string;
	} | null>(null);

	const { data, isSuccess } = useQuery({
		queryKey: ['profile', 'details-producer'],
		queryFn: async ({ signal }) =>
			(
				await api.get<{
					message?: string;
					referral: string;
					valueToReceive: number;
					dateOfReceipt: string;
					safes: Array<{
						insuranceCompany: {
							image: string;
							name: string;
						};
						insured: {
							name: string;
						};
						vehicle: {
							plate?: string;
							overnightPostalCode: string;
						};
						amount: number;
						requestAt: string;
					}>;
					quotes: Array<{
						insuranceCompany: {
							image: string;
							name: string;
						};
						insured: {
							name: string;
						};
						vehicle: {
							plate?: string;
							overnightPostalCode: string;
						};
						amount: number;
						requestAt: string;
						effectivedAt: string;
					}>;
				}>('/auth/profile/details-producer', {
					signal,
				})
			).data,
	});

	const transformToPeriods = (
		// biome-ignore lint/suspicious/noExplicitAny: quotes
		quotes: any[] = [],
		// biome-ignore lint/suspicious/noExplicitAny: safes
		safes: any[] = [],
	): Period[] => {
		// biome-ignore lint/suspicious/noExplicitAny: quotes
		const groupedPeriods = quotes?.reduce<Record<string, any>>((acc, quote) => {
			const dateStr =
				quote?.requestAt || quote?.dateOfReceipt || quote?.issueDate;
			const date = parseISO(dateStr);

			const year = date.getFullYear();
			const month = date.getMonth() + 1;

			const key = `${year}-${month.toString().padStart(2, '0')}`;

			if (!acc[key]) {
				acc[key] = {
					label: date
						.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
						.replace(/^\w/, (c) => c.toUpperCase()),
					month,
					year,
					totalInsurances: 0,
					netPremium: 0,
					totalCommission: 0,
					commissionRate: 15,
					goalPremium: 0,
					vsLastMonth: 0,
					paid: false,
					paymentDate: '',
					commission: 0,
					insurances: [],
					quotes: [],
				};
			}

			const period = acc[key];

			const netPremium = quote.amount || 0;
			const commission = quote.amount || 0;

			period.quotes.push({
				id: quote.vehicle?.plate,
				client: quote.insured?.name || 'Cliente não informado',
				type: 'car',
				netPremium,
				commission,
				issueDate: format(date, 'dd/MM/yyyy'),
				cep: quote.vehicle?.overnightPostalCode || '',
				insurance: quote?.insuranceCompany?.image,
				status: quote?.status,
			});

			period.totalInsurances += 1;
			period.netPremium += netPremium;
			period.totalCommission += commission;
			period.commission = period.totalCommission;

			return acc;
		}, {});

		safes?.forEach((safe) => {
			const dateStr = safe?.requestAt || safe?.dateOfReceipt || safe?.issueDate;
			const date = parseISO(dateStr);

			const year = date.getFullYear();
			const month = date.getMonth() + 1;

			const key = `${year}-${month.toString().padStart(2, '0')}`;

			if (!groupedPeriods[key]) {
				groupedPeriods[key] = {
					label: date
						.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
						.replace(/^\w/, (c) => c.toUpperCase()),
					month,
					year,
					totalInsurances: 0,
					netPremium: 0,
					totalCommission: 0,
					commissionRate: 15,
					goalPremium: 0,
					vsLastMonth: 0,
					paid: false,
					paymentDate: '',
					commission: 0,
					insurances: [],
					quotes: [],
				};
			}

			const period = groupedPeriods[key];

			const netPremium = safe.amount || 0;
			const commission = safe.amount || 0;

			period.insurances.push({
				id: safe.vehicle?.plate,
				client: safe.insured?.name || 'Cliente não informado',
				type: 'car',
				netPremium,
				commission,
				issueDate: format(date, 'dd/MM/yyyy'),
				cep: safe.vehicle?.overnightPostalCode || '',
				insurance: safe?.insuranceCompany?.image,
			});

			period.totalInsurances += 1;
			period.netPremium += netPremium;
			period.totalCommission += commission;
			period.commission = period.totalCommission;
		});

		return Object.values(groupedPeriods)
			.sort((a, b) => {
				if (a.year !== b.year) {
					return b.year - a.year;
				}

				return b.month - a.month;
			})
			.reverse();
	};

	// biome-ignore lint/correctness/useExhaustiveDependencies: useMemo
	const periods: Period[] = useMemo(() => {
		return transformToPeriods(data?.quotes || [], data?.safes || []);
	}, [data?.quotes, data?.safes]);

	const ALL_YEAR_INSURANCES = periods.flatMap((p) => p.insurances);
	const ALL_YEAR_QUOTES = periods.flatMap((p) => p.quotes);

	const MONTH_NAMES: Record<string, string> = {
		'01': 'Janeiro',
		'02': 'Fevereiro',
		'03': 'Março',
		'04': 'Abril',
		'05': 'Maio',
		'06': 'Junho',
		'07': 'Julho',
		'08': 'Agosto',
		'09': 'Setembro',
		'10': 'Outubro',
		'11': 'Novembro',
		'12': 'Dezembro',
	};

	function fmt(value: number) {
		return value.toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL',
		});
	}

	function groupByMonth<T>(
		items: T[],
		getDate: (item: T) => string,
	): { key: string; label: string; items: T[] }[] {
		const map: Record<string, T[]> = {};

		for (const item of items) {
			const parts = getDate(item).split('/');
			const key = `${parts[2]}-${parts[1]}`;
			if (!map[key]) map[key] = [];
			map[key].push(item);
		}

		return Object.entries(map)
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([key, list]) => ({
				key,
				label: `${MONTH_NAMES[key.split('-')[1]] ?? key.split('-')[1]} ${key.split('-')[0]}`,
				items: list,
			}))
			.reverse();
	}

	function buildCepGroups(insurances: Insurance[]): CepGroup[] {
		const map: Record<string, CepGroup> = {};

		for (const ins of insurances) {
			const cep = ins.cep ?? 'N/D';
			const state = ins.state ?? '';

			if (!map[cep]) {
				map[cep] = { cep, state, count: 0, commission: 0, insurances: [] };
			}

			map[cep].count++;
			map[cep].commission += ins.commission;
			map[cep].insurances.push(ins);
		}

		return Object.values(map).sort((a, b) => b.count - a.count);
	}

	function BottomSheet({
		open,
		onClose,
		title,
		subtitle,
		children,
		footer,
	}: {
		open: boolean;
		onClose: () => void;
		title: string;
		subtitle?: string;
		children: React.ReactNode;
		footer?: React.ReactNode;
	}) {
		const sheetRef = useRef<HTMLDivElement>(null);
		const backdropRef = useRef<HTMLDivElement>(null);
		const [mounted, setMounted] = useState(false);

		useEffect(() => {
			if (open) setMounted(true);
		}, [open]);

		useEffect(() => {
			const sheet = sheetRef.current;
			const backdrop = backdropRef.current;
			if (!sheet || !backdrop) return;
			if (open) {
				sheet.style.transform = 'translateY(100%)';
				backdrop.style.opacity = '0';
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						sheet.style.transition =
							'transform 0.38s cubic-bezier(0.32, 0.72, 0, 1)';
						sheet.style.transform = 'translateY(0)';
						backdrop.style.transition = 'opacity 0.3s ease';
						backdrop.style.opacity = '1';
					});
				});
			} else if (mounted) {
				sheet.style.transition =
					'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)';
				sheet.style.transform = 'translateY(100%)';
				backdrop.style.transition = 'opacity 0.28s ease';
				backdrop.style.opacity = '0';
				const t = setTimeout(() => setMounted(false), 340);
				return () => clearTimeout(t);
			}
		}, [open, mounted]);

		if (!mounted) return null;

		return (
			// biome-ignore lint/a11y/noStaticElementInteractions: div
			// biome-ignore lint/a11y/useKeyWithClickEvents: div
			<div
				ref={backdropRef}
				className='fixed inset-0 z-50 flex items-end justify-center'
				style={{ background: 'rgba(0,0,0,0.45)', opacity: 0 }}
				onClick={onClose}
			>
				{/** biome-ignore lint/a11y/noStaticElementInteractions: div */}
				{/** biome-ignore lint/a11y/useKeyWithClickEvents: div */}
				<div
					ref={sheetRef}
					className='w-full max-w-lg bg-white rounded-t-2xl flex flex-col'
					style={{ maxHeight: '88vh', transform: 'translateY(100%)' }}
					onClick={(e) => e.stopPropagation()}
				>
					<div className='flex justify-center pt-3 pb-1 shrink-0'>
						<div className='w-10 h-1 rounded-full bg-zinc-300' />
					</div>
					<div className='px-5 pb-3 pt-1 border-b border-zinc-200 flex items-center justify-between shrink-0'>
						<div>
							<p className='text-base font-bold text-zinc-900'>{title}</p>
							{subtitle && (
								<p className='text-xs text-zinc-500 mt-0.5'>{subtitle}</p>
							)}
						</div>
						<button
							type='button'
							onClick={onClose}
							className='h-8 w-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-700 hover:bg-zinc-200 transition-colors'
						>
							<X className='h-4 w-4' />
						</button>
					</div>
					<div className='overflow-y-auto flex-1 min-h-0'>{children}</div>
					{footer && (
						<div className='shrink-0 border-t border-zinc-100'>{footer}</div>
					)}
				</div>
			</div>
		);
	}

	function MonthHeader({
		label,
		commission,
		number = false,
	}: {
		label: string;
		commission: number;
		number?: boolean;
	}) {
		return (
			<div className='px-5 py-2.5 bg-zinc-50 border-y border-zinc-100 flex items-center justify-between'>
				<span className='text-xs text-zinc-500 uppercase tracking-widest font-semibold'>
					{label}
				</span>
				<div className='flex items-center gap-1 text-zinc-800'>
					<span className='text-xs font-semibold'>
						{number ? commission : fmt(commission)}
					</span>
				</div>
			</div>
		);
	}

	function AnnualFooter({
		count,
		label,
		commission,
		number = false,
	}: {
		count: number;
		label: string;
		commission: number;
		number?: boolean;
	}) {
		return (
			<div className='px-5 py-4 bg-zinc-50'>
				<div className='flex items-center justify-between mb-1.5'>
					<span className='text-xs text-zinc-500'>
						{count} {label} no Ano
					</span>
					{!number && (
						<span className='text-xs font-bold text-zinc-800'>
							{fmt(commission)}
						</span>
					)}
					{number && (
						<span className='text-xs font-bold text-zinc-800'>
							Cotações Anual
						</span>
					)}
				</div>
				<div className='h-1.5 w-full bg-zinc-200 rounded-full overflow-hidden'>
					<div className='h-full rounded-full bg-emerald-500 w-full' />
				</div>
				{!number && (
					<p className='text-xs text-zinc-500 text-right mt-1'>
						Comissão Anual
					</p>
				)}
			</div>
		);
	}

	function AllQuotesSheet({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) {
		const months = groupByMonth(ALL_YEAR_QUOTES, (i) => i?.issueDate);

		return (
			<BottomSheet
				open={open}
				onClose={onClose}
				title='Todos as Cotações'
				subtitle={`${ALL_YEAR_QUOTES.length} Cotações · Ano Todo`}
				footer={
					<AnnualFooter
						count={ALL_YEAR_QUOTES.length}
						label='Cotações'
						commission={ALL_YEAR_QUOTES.length}
						number
					/>
				}
			>
				{months.map(({ key, label, items }) => (
					<div key={key}>
						<MonthHeader label={label} commission={items.length} number />
						<div className='divide-y divide-zinc-200 px-5'>
							{items.map((ins) => (
								<div key={ins.id} className='flex items-center gap-2 py-3'>
									<div className='size-9 rounded-sm overflow-hidden bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0'>
										<User2Icon />
									</div>
									<div className='flex-1 min-w-0'>
										<p className='text-sm font-medium truncate text-zinc-900'>
											{capitalizeFirstLetters(ins.client)}
										</p>
										<p className='text-xs text-zinc-500'>
											{ins.id
												? isPlate(ins.id)
													? maskPlate(ins.id)
													: ins.id
												: 'Sem Placa'}
										</p>
									</div>
									<div className='flex flex-col items-end gap-1 shrink-0'>
										<Badge
											variant={
												ins.status === 'waiting'
													? 'warning'
													: ins.status === 'confirmed'
														? 'success'
														: ins.status === 'recused'
															? 'destructive'
															: 'outline'
											}
										>
											{translateQuoteStatus(ins.status as QuoteStatus)}
										</Badge>
										<span className='text-xs text-zinc-500 font-medium'>
											{ins?.issueDate}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</BottomSheet>
		);
	}

	function AllInsurancesSheet({
		open,
		onClose,
	}: {
		open: boolean;
		onClose: () => void;
	}) {
		const months = groupByMonth(ALL_YEAR_INSURANCES, (i) => i?.issueDate);
		const annualCommission = ALL_YEAR_INSURANCES.reduce(
			(s, i) => s + i.commission,
			0,
		);

		return (
			<BottomSheet
				open={open}
				onClose={onClose}
				title='Todos os Seguros'
				subtitle={`${ALL_YEAR_INSURANCES.length} Seguros · Ano Todo`}
				footer={
					<AnnualFooter
						count={ALL_YEAR_INSURANCES.length}
						label='Seguros'
						commission={annualCommission}
					/>
				}
			>
				{months.map(({ key, label, items }) => (
					<div key={key}>
						<MonthHeader
							label={label}
							commission={items.reduce((s, i) => s + i.commission, 0)}
						/>
						<div className='divide-y divide-zinc-200 px-5'>
							{items.map((ins) => (
								<div key={ins.id} className='flex items-center gap-2 py-3'>
									<div className='size-9 rounded-sm overflow-hidden bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0'>
										<Image
											// @ts-expect-error
											src={ins.insurance}
											width={52}
											height={52}
											className='size-full object-center'
											alt='Insurance'
										/>
									</div>
									<div className='flex-1 min-w-0'>
										<p className='text-sm font-medium truncate text-zinc-900'>
											{capitalizeFirstLetters(ins.client)}
										</p>
										<p className='text-xs text-zinc-500'>
											{ins.id
												? isPlate(ins.id)
													? maskPlate(ins.id)
													: ins.id
												: 'Sem Placa'}
										</p>
									</div>
									<div className='flex flex-col items-end gap-1 shrink-0'>
										<span className='text-sm font-semibold text-emerald-600'>
											{fmt(ins.commission)}
										</span>
										<span className='text-xs text-zinc-500 font-medium'>
											{ins?.issueDate}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</BottomSheet>
		);
	}

	function CepSheet({
		open,
		onClose,
		cep,
		state,
	}: {
		open: boolean;
		onClose: () => void;
		cep: string;
		state: string;
	}) {
		const yearInsurances = ALL_YEAR_INSURANCES.filter((i) => i.cep === cep);
		const months = groupByMonth(yearInsurances, (i) => i?.issueDate);
		const annualCommission = yearInsurances.reduce(
			(s, i) => s + i.commission,
			0,
		);

		return (
			<BottomSheet
				open={open}
				onClose={onClose}
				title={maskPostalCode(cep)}
				subtitle={`${state ? `${state} · ` : ''}${yearInsurances.length} Seguro${yearInsurances.length !== 1 ? 's' : ''} no Ano`}
				footer={
					yearInsurances.length > 0 ? (
						<AnnualFooter
							count={yearInsurances.length}
							label={`seguro${yearInsurances.length !== 1 ? 's' : ''}`}
							commission={annualCommission}
						/>
					) : undefined
				}
			>
				{months.map(({ key, label, items }) => (
					<div key={key}>
						<MonthHeader
							label={label}
							commission={items.reduce((s, i) => s + i.commission, 0)}
						/>
						<div className='divide-y divide-zinc-200 px-5'>
							{items.map((ins) => (
								<div key={ins.id} className='flex items-center gap-2 py-3'>
									<div className='size-9 rounded-sm overflow-hidden bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0'>
										<Image
											// @ts-expect-error
											src={ins.insurance}
											width={52}
											height={52}
											className='size-full object-center'
											alt='Insurance'
										/>
									</div>
									<div className='flex-1 min-w-0'>
										<p className='text-sm font-medium truncate text-zinc-900'>
											{capitalizeFirstLetters(ins.client)}
										</p>
										<p className='text-xs text-zinc-500'>
											{ins.id
												? isPlate(ins.id)
													? maskPlate(ins.id)
													: ins.id
												: 'Sem Placa'}
										</p>
									</div>
									<div className='flex flex-col items-end gap-1 shrink-0'>
										<span className='text-sm font-semibold text-emerald-600'>
											{fmt(ins.commission)}
										</span>
										<span className='text-xs text-zinc-500 font-medium'>
											{ins?.issueDate}
										</span>
									</div>
								</div>
							))}
						</div>
					</div>
				))}
			</BottomSheet>
		);
	}

	const period = periods[periodIdx];
	const canPrev = periodIdx > 0;
	const canNext = periodIdx < periods.length - 1;

	const groupsCeps = buildCepGroups(ALL_YEAR_INSURANCES);

	const { mutate: signOut, isPending: isPendingSignout } = useSignOut();

	const { data: session, isPending } = auth.useSession();

	function logout() {
		toast.dismiss();

		signOut(undefined, {
			onSuccess(_data, _variables, _result, ctx) {
				setTimeout(() => {
					ctx.client.clear();
				}, 1000);

				replace('/sign-in');
			},
			onError(error) {
				toast.error(error.message);
			},
		});
	}

	async function copyReferral() {
		try {
			const message = data?.message;

			const url = `https://segwise.com.br/referral/${data?.referral}`;

			const content = message ? `${message}\n\n${url}` : url;

			await navigator.clipboard.writeText(content);

			toast.success('LINK DE INDICAÇÃO COPIADO');
		} catch {
			toast.error('FALHA AO COPIAR LINK');
		}
	}

	useEffect(() => {
		const isVisibleBalance = localStorage.getItem('visible:balance');

		if (isVisibleBalance === 'true') {
			setHidden(false);
		}
	}, []);

	useEffect(() => {
		if (isSuccess) {
			setPeriodIdx(
				periods.findIndex(
					(e) =>
						e.label
							.toLowerCase()
							.includes(format(new Date(), 'MMMM').toLowerCase()) &&
						e.label.toLowerCase().includes(new Date().getFullYear().toString()),
				),
			);
		}
	}, [periods, isSuccess]);

	return (
		<div className='min-h-screen font-sans max-w-md mx-auto'>
			<AllQuotesSheet
				open={showAllQuotes}
				onClose={() => setShowAllQuotes(false)}
			/>
			<AllInsurancesSheet
				open={showAllInsurances}
				onClose={() => setShowAllInsurances(false)}
			/>
			<AllInsurancesSheet
				open={showAllInsurances}
				onClose={() => setShowAllInsurances(false)}
			/>
			<CepSheet
				open={!!selectedCep}
				cep={selectedCep?.cep ?? ''}
				state={selectedCep?.state ?? ''}
				onClose={() => setSelectedCep(null)}
			/>
			<div
				className='relative overflow-hidden px-3 pt-12 pb-6'
				style={{
					background:
						'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
				}}
			>
				<div className='absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-20 blur-3xl bg-[#6366f1]' />
				<div className='absolute top-8 -left-12 h-36 w-36 rounded-full opacity-15 blur-3xl bg-[#8b5cf6]' />
				<div className='relative flex items-center justify-between mb-8'>
					<div className='flex items-center gap-3'>
						<div className='h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-[#0f172a] shrink-0 bg-white'>
							{session?.user.name.slice(0, 2).toUpperCase()}
						</div>
						<div>
							<p className='text-white/50 text-[11px] leading-none mb-0.5 uppercase tracking-widest'>
								Produtor
							</p>
							{isPending && (
								<Skeleton className='w-24 h-4 bg-muted-foreground' />
							)}
							{!isPending && session?.user.name && (
								<p className='text-white text-sm font-semibold leading-none'>
									{capitalizeFirstLetters(session?.user.name as string)
										.split(' ')
										.slice(0, 2)
										.join(' ')}
								</p>
							)}
						</div>
						<button
							type='button'
							className='ml-1 h-7 w-7 rounded-full flex items-center justify-center transition-colors cursor-pointer'
							style={{
								background: 'rgba(255,255,255,0.08)',
								border: '1px solid rgba(255,255,255,0.12)',
							}}
							title='Sair'
							onClick={logout}
						>
							{!isPendingSignout && (
								<LogOut className='size-3.5 text-white/50' />
							)}
							{!!isPendingSignout && (
								<Loader2Icon className='size-3.5 text-white/50 animate-spin' />
							)}
						</button>
					</div>
					<div>
						<div
							className='flex items-center rounded-full px-1 py-1 w-fit ml-auto'
							style={{
								background: 'rgba(255,255,255,0.08)',
								border: '1px solid rgba(255,255,255,0.1)',
							}}
						>
							<button
								type='button'
								onClick={() => canPrev && setPeriodIdx((i) => i - 1)}
								disabled={!canPrev}
								className='size-6 flex items-center justify-center rounded-full transition-colors disabled:opacity-30'
								style={{ color: 'rgba(255,255,255,0.7)' }}
							>
								<ChevronLeft className='size-3.5' />
							</button>
							<Suspense>
								<span className='text-white text-xs font-medium px-1 text-center'>
									{period?.label || 'Abril 2026'}
								</span>
							</Suspense>
							<button
								type='button'
								onClick={() => canNext && setPeriodIdx((i) => i + 1)}
								disabled={!canNext}
								className='size-6 flex items-center justify-center rounded-full transition-colors disabled:opacity-30'
								style={{ color: 'rgba(255,255,255,0.7)' }}
							>
								<ChevronRight className='size-3.5' />
							</button>
						</div>
						<Button
							variant='link'
							size='sm'
							className='text-white text-xs text-right mt-2'
							onClick={copyReferral}
						>
							<CopyIcon /> Link de indicação:
							<br />
							{data?.referral.toUpperCase()}
						</Button>
					</div>
				</div>
				<div className='relative'>
					<div className='flex items-center gap-2 mb-1.5'>
						<p className='text-white/50 text-xs uppercase tracking-widest'>
							{period?.paid ? 'Comissão paga' : 'Comissão a receber'}
						</p>
						<button
							type='button'
							onClick={() =>
								setHidden((h) => {
									localStorage.setItem('visible:balance', String(h));

									return !h;
								})
							}
							className='text-white/30 hover:text-white/60 transition-colors'
						>
							{hidden ? (
								<EyeOff className='size-3.5' />
							) : (
								<Eye className='size-3.5' />
							)}
						</button>
					</div>

					<p className='text-4xl font-bold text-white tracking-tight mb-3'>
						{hidden
							? 'R$ ••••••'
							: !period?.commission
								? 'R$ 0,00'
								: fmt(period.commission)}
					</p>

					{period?.paid ? (
						<div
							className='inline-flex items-center gap-1.5 rounded-full px-3 py-1'
							style={{
								background: 'rgba(34,197,94,0.15)',
								border: '1px solid rgba(34,197,94,0.25)',
							}}
						>
							<CalendarCheck className='h-3 w-3 text-green-300' />
							<span className='text-xs text-green-300 font-medium'>
								Pago em {period?.paidDate}
							</span>
						</div>
					) : (
						<div
							className='inline-flex items-center gap-1.5 rounded-full px-3 py-1'
							style={{
								background: 'rgba(251,191,36,0.15)',
								border: '1px solid rgba(251,191,36,0.2)',
							}}
						>
							<Clock className='h-3 w-3 text-amber-300' />
							<span className='text-xs text-amber-300 font-medium'>
								Pagamento previsto para{' '}
								{period?.paymentDate || !!data?.dateOfReceipt
									? format(
											parseISO(data?.dateOfReceipt as string),
											'dd/MM/yyyy',
										)
									: '--/--/-----'}
							</span>
						</div>
					)}
				</div>
			</div>
			<div className='rounded-2xl overflow-hidden'>
				<Tabs defaultValue='quotes'>
					<TabsList className='w-full bg-white rounded-none py-1 px-2 h-11.5 border-b'>
						<TabsTrigger
							value='quotes'
							className='flex-1 text-sm rounded-sm h-full data-[state=active]:bg-[#1e293b] data-[state=active]:text-white data-[state=active]:shadow-sm'
						>
							Cotações
						</TabsTrigger>
						<TabsTrigger
							value='insurances'
							className='flex-1 text-sm rounded-sm h-full data-[state=active]:bg-[#1e293b] data-[state=active]:text-white data-[state=active]:shadow-sm'
						>
							Seguros
						</TabsTrigger>
						<TabsTrigger
							value='cep'
							className='flex-1 text-sm rounded-sm h-full data-[state=active]:bg-[#1e293b] data-[state=active]:text-white data-[state=active]:shadow-sm'
						>
							Por CEP
						</TabsTrigger>
					</TabsList>
					<TabsContent value='quotes' className='mt-0'>
						{!period?.quotes || period?.quotes.length === 0 ? (
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant='icon' className='rounded-full'>
										<FileIcon />
									</EmptyMedia>
									<EmptyTitle>Nenhum registro encontrada!</EmptyTitle>
									<EmptyDescription>
										Você não tem nenhum registro no momento
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						) : (
							period?.quotes.map((ins) => (
								<div key={ins.id} className='divide-y divide-zinc-200 px-3'>
									<div className='flex items-center gap-2 py-3.5'>
										<div className='size-9 rounded-sm overflow-hidden bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0'>
											<User2Icon />
										</div>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium truncate text-zinc-900'>
												{capitalizeFirstLetters(ins.client)}
											</p>
											<p className='text-xs text-zinc-500'>
												{ins.id
													? isPlate(ins.id)
														? maskPlate(ins.id)
														: ins.id
													: 'Sem Placa'}
											</p>
										</div>
										<div className='flex flex-col items-end gap-1 shrink-0'>
											<Badge
												variant={
													ins.status === 'waiting'
														? 'warning'
														: ins.status === 'confirmed'
															? 'success'
															: ins.status === 'recused'
																? 'destructive'
																: 'outline'
												}
											>
												{translateQuoteStatus(ins.status as QuoteStatus)}
											</Badge>
											<span className='text-xs text-zinc-500 font-medium'>
												{ins?.issueDate}
											</span>
										</div>
									</div>
								</div>
							))
						)}
						{!!period?.quotes?.length && (
							<div className='px-5 pb-4 pt-1'>
								<button
									type='button'
									className='w-full text-sm text-primary underline underline-offset-4 font-medium flex items-center justify-center gap-1 py-2 hover:text-primary transition-colors'
									onClick={() => setShowAllQuotes(true)}
								>
									Ver todas as cotações
									<ArrowUpRightIcon className='size-3.5' />
								</button>
							</div>
						)}
					</TabsContent>
					<TabsContent value='insurances' className='mt-0'>
						{!period?.insurances || period?.insurances.length === 0 ? (
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant='icon' className='rounded-full'>
										<FileIcon />
									</EmptyMedia>
									<EmptyTitle>Nenhum registro encontrada!</EmptyTitle>
									<EmptyDescription>
										Você não tem nenhum registro no momento
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						) : (
							period?.insurances.map((ins) => (
								<div key={ins.id} className='divide-y divide-zinc-200 px-3'>
									<div className='flex items-center gap-2 py-3.5'>
										<div className='size-9 rounded-sm overflow-hidden bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0'>
											<Image
												// @ts-expect-error
												src={ins.insurance}
												width={52}
												height={52}
												className='size-full object-center'
												alt='Insurance'
											/>
										</div>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium truncate text-zinc-900'>
												{capitalizeFirstLetters(ins.client)}
											</p>
											<p className='text-xs text-zinc-500'>
												{ins.id
													? isPlate(ins.id)
														? maskPlate(ins.id)
														: ins.id
													: 'Sem Placa'}
											</p>
										</div>
										<div className='flex flex-col items-end gap-1 shrink-0'>
											<span className='text-sm font-semibold text-emerald-600'>
												+{fmt(ins.commission)}
											</span>
											<span className='text-xs text-zinc-500 font-medium'>
												{ins?.issueDate}
											</span>
										</div>
									</div>
								</div>
							))
						)}
						{!!period?.insurances?.length && (
							<div className='px-5 pb-4 pt-1'>
								<button
									type='button'
									className='w-full text-sm text-primary underline underline-offset-4 font-medium flex items-center justify-center gap-1 py-2 hover:text-primary transition-colors'
									onClick={() => setShowAllInsurances(true)}
								>
									Ver todos os seguros
									<ArrowUpRightIcon className='size-3.5' />
								</button>
							</div>
						)}
					</TabsContent>
					<TabsContent value='cep' className='mt-0'>
						{!period?.insurances || period?.insurances.length === 0 ? (
							<Empty>
								<EmptyHeader>
									<EmptyMedia variant='icon' className='rounded-full'>
										<FileIcon />
									</EmptyMedia>
									<EmptyTitle>Nenhum registro encontrada!</EmptyTitle>
									<EmptyDescription>
										Você não tem nenhum registro no momento
									</EmptyDescription>
								</EmptyHeader>
							</Empty>
						) : (
							<div className='divide-y divide-zinc-200 px-3'>
								{groupsCeps.map((group) => (
									// biome-ignore lint/a11y/noStaticElementInteractions: div
									// biome-ignore lint/a11y/useKeyWithClickEvents: div
									<div
										key={group.cep}
										className='flex items-center gap-2 py-3.5'
										onClick={() =>
											setSelectedCep({
												cep: group.cep,
												state: group.state,
											})
										}
									>
										<div className='size-9 rounded-sm overflow-hidden bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-400 shrink-0'>
											<Building2Icon />
										</div>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-semibold truncate text-zinc-900'>
												{maskPostalCode(group.cep)}
											</p>
											<p className='text-xs text-zinc-500'>{group.state}</p>
										</div>
										<div className='flex flex-col items-end gap-1 shrink-0'>
											<span className='text-sm font-semibold text-zinc-800'>
												{group.count} Seguros
											</span>
											<span className='text-xs font-medium text-indigo-400 flex flex-row items-center justify-end'>
												Ver detalhes{' '}
												<ChevronRightIcon className='size-3.5 stroke-2.5' />
											</span>
										</div>
									</div>
								))}
							</div>
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}

export default ProducerDashboard;
