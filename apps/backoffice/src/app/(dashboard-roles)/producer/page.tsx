'use client';

import {
	AlertCircle,
	ArrowUpRight,
	BarChart3,
	CalendarCheck,
	CheckCircle2,
	ChevronLeft,
	ChevronRight,
	Clock,
	Eye,
	EyeOff,
	FileText,
	LogOut,
	Shield,
	TrendingUp,
	X,
	XCircle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ─── Types ────────────────────────────────────────────────────────────────────

type QuotationStatus =
	| 'pending'
	| 'in_analysis'
	| 'approved'
	| 'refused'
	| 'expired';

type QuotationStatusMap = Record<
	QuotationStatus,
	{ label: string; count: number }
>;

type Quotation = {
	id: string;
	client: string;
	type: string;
	premium: number;
	status: QuotationStatus;
	date: string;
	cep?: string;
	state?: string;
};

type Insurance = {
	id: string;
	client: string;
	type: string;
	netPremium: number;
	commission: number;
	issueDate: string;
	cep?: string;
	state?: string;
};

type Period = {
	label: string;
	month: number;
	year: number;
	totalQuotations: number;
	totalInsurances: number;
	netPremium: number;
	totalCommission: number;
	commissionRate: number;
	goalQuotations: number;
	goalPremium: number;
	conversionRate: number;
	vsLastMonth: number;
	paid: boolean;
	paidDate?: string;
	paymentDate?: string;
	commission: number;
	quotationStatus: QuotationStatusMap;
	quotations: Quotation[];
	insurances: Insurance[];
};

type CepGroup = {
	cep: string;
	state: string;
	count: number;
	insurances: Insurance[];
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const PRODUCER = {
	name: 'João Silva',
	code: 'PROD-0042',
	avatar: 'JS',
};

const COMMISSION_RATE = 0.15;

const STATE_COLORS: Record<string, string> = {
	SP: '#6366f1',
	RJ: '#10b981',
	MG: '#f59e0b',
	RS: '#3b82f6',
	PR: '#ef4444',
	SC: '#8b5cf6',
	BA: '#f97316',
	PE: '#14b8a6',
};

const PERIODS: Period[] = [
	{
		label: 'Fevereiro 2025',
		month: 2,
		year: 2025,
		totalQuotations: 39,
		totalInsurances: 16,
		netPremium: 142300,
		totalCommission: 21345,
		commissionRate: 15,
		goalQuotations: 50,
		goalPremium: 200000,
		conversionRate: 41.0,
		vsLastMonth: +5.2,
		paid: true,
		paidDate: '15/03/2025',
		commission: 21345,
		quotationStatus: {
			approved: { label: 'Aprovadas', count: 16 },
			pending: { label: 'Pendentes', count: 3 },
			in_analysis: { label: 'Em análise', count: 2 },
			refused: { label: 'Recusadas', count: 14 },
			expired: { label: 'Expiradas', count: 4 },
		},
		quotations: [
			{
				id: 'COT-1050',
				client: 'Sílvia Rocha',
				type: 'Vida',
				premium: 980,
				status: 'approved',
				date: '10/02/2025',
				cep: '01310-100',
				state: 'SP',
			},
			{
				id: 'COT-1049',
				client: 'Marcos Lima',
				type: 'Auto',
				premium: 3400,
				status: 'approved',
				date: '08/02/2025',
				cep: '20040-020',
				state: 'RJ',
			},
			{
				id: 'COT-1048',
				client: 'Luana Ferraz',
				type: 'Residencial',
				premium: 1100,
				status: 'refused',
				date: '05/02/2025',
				cep: '30112-000',
				state: 'MG',
			},
			{
				id: 'COT-1047',
				client: 'Diego Nunes',
				type: 'Empresarial',
				premium: 6500,
				status: 'approved',
				date: '02/02/2025',
				cep: '01310-100',
				state: 'SP',
			},
		],
		insurances: [
			{
				id: 'APL-5800',
				client: 'Sílvia Rocha',
				type: 'Vida',
				netPremium: 882,
				commission: 132.3,
				issueDate: '11/02/2025',
				cep: '01310-100',
				state: 'SP',
			},
			{
				id: 'APL-5799',
				client: 'Marcos Lima',
				type: 'Auto',
				netPremium: 3060,
				commission: 459,
				issueDate: '09/02/2025',
				cep: '20040-020',
				state: 'RJ',
			},
			{
				id: 'APL-5798',
				client: 'Diego Nunes',
				type: 'Empresarial',
				netPremium: 5850,
				commission: 877.5,
				issueDate: '03/02/2025',
				cep: '01310-100',
				state: 'SP',
			},
			{
				id: 'APL-5797',
				client: 'Carla Mendes',
				type: 'Residencial',
				netPremium: 1080,
				commission: 162,
				issueDate: '06/02/2025',
				cep: '90010-150',
				state: 'RS',
			},
			{
				id: 'APL-5796',
				client: 'Paulo Braga',
				type: 'Auto',
				netPremium: 2700,
				commission: 405,
				issueDate: '14/02/2025',
				cep: '80010-010',
				state: 'PR',
			},
		],
	},
	{
		label: 'Março 2025',
		month: 3,
		year: 2025,
		totalQuotations: 44,
		totalInsurances: 19,
		netPremium: 163900,
		totalCommission: 24585,
		commissionRate: 15,
		goalQuotations: 50,
		goalPremium: 200000,
		conversionRate: 43.2,
		vsLastMonth: +8.6,
		paid: true,
		paidDate: '15/04/2025',
		commission: 24585,
		quotationStatus: {
			approved: { label: 'Aprovadas', count: 19 },
			pending: { label: 'Pendentes', count: 4 },
			in_analysis: { label: 'Em análise', count: 3 },
			refused: { label: 'Recusadas', count: 12 },
			expired: { label: 'Expiradas', count: 6 },
		},
		quotations: [
			{
				id: 'COT-1080',
				client: 'Roberto Assis',
				type: 'Auto',
				premium: 3900,
				status: 'approved',
				date: '28/03/2025',
				cep: '01310-100',
				state: 'SP',
			},
			{
				id: 'COT-1079',
				client: 'Clara Duarte',
				type: 'Residencial',
				premium: 1250,
				status: 'approved',
				date: '25/03/2025',
				cep: '30112-000',
				state: 'MG',
			},
			{
				id: 'COT-1078',
				client: 'Felipe Torres',
				type: 'Vida',
				premium: 760,
				status: 'pending',
				date: '22/03/2025',
				cep: '90010-150',
				state: 'RS',
			},
			{
				id: 'COT-1077',
				client: 'Amanda Sousa',
				type: 'Empresarial',
				premium: 8200,
				status: 'approved',
				date: '18/03/2025',
				cep: '20040-020',
				state: 'RJ',
			},
		],
		insurances: [
			{
				id: 'APL-5810',
				client: 'Roberto Assis',
				type: 'Auto',
				netPremium: 3510,
				commission: 526.5,
				issueDate: '29/03/2025',
				cep: '01310-100',
				state: 'SP',
			},
			{
				id: 'APL-5809',
				client: 'Clara Duarte',
				type: 'Residencial',
				netPremium: 1125,
				commission: 168.75,
				issueDate: '26/03/2025',
				cep: '30112-000',
				state: 'MG',
			},
			{
				id: 'APL-5808',
				client: 'Amanda Sousa',
				type: 'Empresarial',
				netPremium: 7380,
				commission: 1107,
				issueDate: '19/03/2025',
				cep: '20040-020',
				state: 'RJ',
			},
			{
				id: 'APL-5807',
				client: 'Renata Costa',
				type: 'Vida',
				netPremium: 720,
				commission: 108,
				issueDate: '24/03/2025',
				cep: '80010-010',
				state: 'PR',
			},
			{
				id: 'APL-5806',
				client: 'Lucas Freitas',
				type: 'Auto',
				netPremium: 2880,
				commission: 432,
				issueDate: '12/03/2025',
				cep: '01310-100',
				state: 'SP',
			},
		],
	},
	{
		label: 'Abril 2025',
		month: 4,
		year: 2025,
		totalQuotations: 48,
		totalInsurances: 21,
		netPremium: 187430.5,
		totalCommission: 28114.57,
		commissionRate: 15,
		goalQuotations: 60,
		goalPremium: 250000,
		conversionRate: 43.75,
		vsLastMonth: +12.4,
		paid: false,
		paymentDate: '15/05/2025',
		commission: 28114.57,
		quotationStatus: {
			approved: { label: 'Aprovadas', count: 21 },
			pending: { label: 'Pendentes', count: 8 },
			in_analysis: { label: 'Em análise', count: 5 },
			refused: { label: 'Recusadas', count: 9 },
			expired: { label: 'Expiradas', count: 5 },
		},
		quotations: [
			{
				id: 'COT-1091',
				client: 'Maria Gonçalves',
				type: 'Auto',
				premium: 4200,
				status: 'approved',
				date: '01/04/2025',
				cep: '01310-100',
				state: 'SP',
			},
			{
				id: 'COT-1090',
				client: 'Fernanda Lima',
				type: 'Vida',
				premium: 890,
				status: 'pending',
				date: '31/03/2025',
				cep: '20040-020',
				state: 'RJ',
			},
			{
				id: 'COT-1089',
				client: 'Carlos Souza',
				type: 'Residencial',
				premium: 1350,
				status: 'in_analysis',
				date: '30/03/2025',
				cep: '30112-000',
				state: 'MG',
			},
			{
				id: 'COT-1088',
				client: 'Renata Alves',
				type: 'Empresarial',
				premium: 7800,
				status: 'refused',
				date: '28/03/2025',
				cep: '90010-150',
				state: 'RS',
			},
			{
				id: 'COT-1087',
				client: 'Paulo Mendes',
				type: 'Auto',
				premium: 3100,
				status: 'approved',
				date: '27/03/2025',
				cep: '80010-010',
				state: 'PR',
			},
		],
		insurances: [
			{
				id: 'APL-5821',
				client: 'Maria Gonçalves',
				type: 'Auto',
				netPremium: 3780,
				commission: 567,
				issueDate: '02/04/2025',
				cep: '01310-100',
				state: 'SP',
			},
			{
				id: 'APL-5820',
				client: 'Paulo Mendes',
				type: 'Auto',
				netPremium: 2790,
				commission: 418.5,
				issueDate: '28/03/2025',
				cep: '80010-010',
				state: 'PR',
			},
			{
				id: 'APL-5819',
				client: 'Ana Costa',
				type: 'Residencial',
				netPremium: 1215,
				commission: 182.25,
				issueDate: '25/03/2025',
				cep: '01310-100',
				state: 'SP',
			},
			{
				id: 'APL-5818',
				client: 'Bruno Ferreira',
				type: 'Vida',
				netPremium: 801,
				commission: 120.15,
				issueDate: '20/03/2025',
				cep: '30112-000',
				state: 'MG',
			},
			{
				id: 'APL-5817',
				client: 'Tatiane Ramos',
				type: 'Empresarial',
				netPremium: 6300,
				commission: 945,
				issueDate: '15/04/2025',
				cep: '20040-020',
				state: 'RJ',
			},
			{
				id: 'APL-5816',
				client: 'Gustavo Alves',
				type: 'Auto',
				netPremium: 2520,
				commission: 378,
				issueDate: '10/04/2025',
				cep: '01310-100',
				state: 'SP',
			},
		],
	},
];

const ALL_YEAR_QUOTATIONS = PERIODS.flatMap((p) => p.quotations);
const ALL_YEAR_INSURANCES = PERIODS.flatMap((p) => p.insurances);

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
	return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function groupByMonth<T>(
	items: T[],
	getDate: (item: T) => string, // dd/mm/yyyy
): { key: string; label: string; items: T[] }[] {
	const map: Record<string, T[]> = {};
	for (const item of items) {
		const parts = getDate(item).split('/');
		const key = `${parts[2]}-${parts[1]}`; // yyyy-mm for sorting
		if (!map[key]) map[key] = [];
		map[key].push(item);
	}
	return Object.entries(map)
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([key, list]) => ({
			key,
			label: `${MONTH_NAMES[key.split('-')[1]] ?? key.split('-')[1]} ${key.split('-')[0]}`,
			items: list,
		}));
}

// Badge config — only approved and refused get coloured badges
const BADGE_CONFIG: Partial<
	Record<
		QuotationStatus,
		{ label: string; bg: string; text: string; icon: React.ReactNode }
	>
> = {
	approved: {
		label: 'Aprovada',
		bg: 'bg-emerald-50',
		text: 'text-emerald-700',
		icon: <CheckCircle2 className='h-3 w-3' />,
	},
	refused: {
		label: 'Recusada',
		bg: 'bg-red-50',
		text: 'text-red-600',
		icon: <XCircle className='h-3 w-3' />,
	},
};

const TYPE_INITIALS: Record<string, string> = {
	Auto: 'AU',
	Vida: 'VI',
	Residencial: 'RE',
	Empresarial: 'EM',
};

// ─── Donut Chart ──────────────────────────────────────────────────────────────

const DONUT_COLORS: Record<QuotationStatus, string> = {
	approved: '#10b981',
	pending: '#fbbf24',
	in_analysis: '#60a5fa',
	refused: '#f87171',
	expired: '#d4d4d8',
};

function QuotationDonut({
	statusMap,
	total,
	animKey,
}: {
	statusMap: QuotationStatusMap;
	total: number;
	animKey: number;
}) {
	const r = 44;
	const cx = 60;
	const cy = 60;
	const strokeWidth = 13;
	const circumference = 2 * Math.PI * r;
	const gap = 2;

	const entries = Object.entries(statusMap) as [
		QuotationStatus,
		{ label: string; count: number },
	][];

	const [ready, setReady] = useState(false);
	useEffect(() => {
		setReady(false);
		const t = requestAnimationFrame(() => {
			requestAnimationFrame(() => setReady(true));
		});
		return () => cancelAnimationFrame(t);
	}, [animKey]);

	let accumulated = 0;
	const segments = entries
		.filter(([, s]) => s.count > 0)
		.map(([key, s]) => {
			const length = (s.count / total) * circumference;
			const gapAdjusted = Math.max(0, length - gap);
			const offset = -accumulated;
			accumulated += length;
			return { key, s, length: gapAdjusted, offset };
		});

	return (
		<div className='rounded-2xl bg-white shadow-sm border border-zinc-100 px-5 py-5'>
			<div className='flex items-center justify-between mb-4'>
				<p className='text-[11px] text-zinc-400 uppercase tracking-widest'>
					Cotações por status
				</p>
				<span className='text-xs font-semibold text-zinc-500'>
					{total} total
				</span>
			</div>
			<div className='flex items-center gap-6'>
				<div className='shrink-0'>
					<svg width='120' height='120' viewBox='0 0 120 120'>
						<circle
							cx={cx}
							cy={cy}
							r={r}
							fill='none'
							stroke='#f4f4f5'
							strokeWidth={strokeWidth}
						/>
						{segments.map(({ key, length, offset }) => (
							<circle
								key={key}
								cx={cx}
								cy={cy}
								r={r}
								fill='none'
								stroke={DONUT_COLORS[key]}
								strokeWidth={strokeWidth}
								strokeDasharray={
									ready ? `${length} ${circumference}` : `0 ${circumference}`
								}
								strokeDashoffset={ready ? offset : 0}
								strokeLinecap='butt'
								style={{
									transform: 'rotate(-90deg)',
									transformOrigin: '60px 60px',
									transition:
										'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease',
								}}
							/>
						))}
						<text
							x={cx}
							y={cy - 5}
							textAnchor='middle'
							dominantBaseline='middle'
							fontSize='20'
							fontWeight='700'
							fill='#18181b'
						>
							{total}
						</text>
						<text
							x={cx}
							y={cy + 13}
							textAnchor='middle'
							dominantBaseline='middle'
							fontSize='9'
							fill='#a1a1aa'
							letterSpacing='1'
						>
							COTAÇÕES
						</text>
					</svg>
				</div>
				<div className='flex flex-col gap-2.5 flex-1'>
					{entries.map(([key, s]) => {
						const pct = total > 0 ? Math.round((s.count / total) * 100) : 0;
						return (
							<div key={key} className='flex items-center justify-between'>
								<div className='flex items-center gap-2'>
									<div
										className='h-2.5 w-2.5 rounded-full shrink-0'
										style={{ background: DONUT_COLORS[key] }}
									/>
									<span className='text-xs text-zinc-600'>{s.label}</span>
								</div>
								<div className='flex items-center gap-2'>
									<span className='text-xs font-semibold text-zinc-800'>
										{s.count}
									</span>
									<span className='text-[10px] text-zinc-400 w-6 text-right'>
										{pct}%
									</span>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}

// ─── Fade wrapper ─────────────────────────────────────────────────────────────

function FadeIn({
	animKey,
	children,
}: {
	animKey: number;
	children: React.ReactNode;
}) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = ref.current;
		if (!el) return;
		el.style.opacity = '0';
		el.style.transform = 'translateY(8px)';
		const raf = requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				el.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
				el.style.opacity = '1';
				el.style.transform = 'translateY(0)';
			});
		});
		return () => cancelAnimationFrame(raf);
	}, [animKey]);
	return <div ref={ref}>{children}</div>;
}

// ─── BottomSheet base ─────────────────────────────────────────────────────────

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
		if (open) {
			setMounted(true);
		}
	}, [open]);

	useEffect(() => {
		const sheet = sheetRef.current;
		const backdrop = backdropRef.current;
		if (!sheet || !backdrop) return;

		if (open) {
			// Enter
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
			// Exit
			sheet.style.transition = 'transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)';
			sheet.style.transform = 'translateY(100%)';
			backdrop.style.transition = 'opacity 0.28s ease';
			backdrop.style.opacity = '0';
			const timer = setTimeout(() => setMounted(false), 340);
			return () => clearTimeout(timer);
		}
	}, [open, mounted]);

	if (!mounted) return null;

	return (
		<div
			ref={backdropRef}
			className='fixed inset-0 z-50 flex items-end justify-center'
			style={{ background: 'rgba(0,0,0,0.45)', opacity: 0 }}
			onClick={onClose}
		>
			<div
				ref={sheetRef}
				className='w-full max-w-lg bg-white rounded-t-2xl flex flex-col'
				style={{ maxHeight: '88vh', transform: 'translateY(100%)' }}
				onClick={(e) => e.stopPropagation()}
			>
				{/* Handle */}
				<div className='flex justify-center pt-3 pb-1 shrink-0'>
					<div className='w-10 h-1 rounded-full bg-zinc-200' />
				</div>

				{/* Header */}
				<div className='px-5 pb-3 pt-1 border-b border-zinc-100 flex items-center justify-between shrink-0'>
					<div>
						<p className='text-base font-bold text-zinc-900'>{title}</p>
						{subtitle && (
							<p className='text-xs text-zinc-400 mt-0.5'>{subtitle}</p>
						)}
					</div>
					<button
						onClick={onClose}
						className='h-8 w-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-zinc-200 transition-colors'
					>
						<X className='h-4 w-4' />
					</button>
				</div>

				{/* Scrollable content */}
				<div className='overflow-y-auto flex-1 min-h-0'>{children}</div>

				{/* Sticky footer */}
				{footer && (
					<div className='shrink-0 border-t border-zinc-100'>{footer}</div>
				)}
			</div>
		</div>
	);
}

// ─── Month section header with commission sum ─────────────────────────────────

function MonthHeader({
	label,
	commission,
}: {
	label: string;
	commission: number;
}) {
	return (
		<div className='px-5 py-2.5 bg-zinc-50 border-y border-zinc-100 flex items-center justify-between'>
			<span className='text-[11px] text-zinc-400 uppercase tracking-widest font-semibold'>
				{label}
			</span>
			<div className='flex items-center gap-1 text-emerald-600'>
				<TrendingUp className='h-3 w-3' />
				<span className='text-[11px] font-semibold'>{fmt(commission)}</span>
			</div>
		</div>
	);
}

// ─── Annual total footer ──────────────────────────────────────────────────────

function AnnualFooter({
	count,
	label,
	commission,
}: {
	count: number;
	label: string;
	commission: number;
}) {
	return (
		<div className='px-5 py-4 bg-zinc-50 border-t border-zinc-100'>
			<div className='flex items-center justify-between mb-1'>
				<span className='text-xs text-zinc-400'>
					{count} {label} no ano
				</span>
				<span className='text-xs font-bold text-zinc-800'>
					{fmt(commission)}
				</span>
			</div>
			<div className='flex items-center gap-1.5'>
				<div className='h-1.5 flex-1 bg-zinc-200 rounded-full overflow-hidden'>
					<div
						className='h-full rounded-full bg-emerald-500'
						style={{ width: '100%' }}
					/>
				</div>
				<span className='text-[10px] text-zinc-400'>comissão total anual</span>
			</div>
		</div>
	);
}

// ─── All Quotations Sheet ─────────────────────────────────────────────────────

function QuotationRow({ q }: { q: Quotation }) {
	const initials = TYPE_INITIALS[q.type] ?? q.type.slice(0, 2).toUpperCase();
	const badge = BADGE_CONFIG[q.status];
	return (
		<div className='flex items-center gap-3.5 py-3'>
			<div className='h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center text-[11px] font-bold text-zinc-500 shrink-0'>
				{initials}
			</div>
			<div className='flex-1 min-w-0'>
				<p className='text-sm font-medium text-zinc-900 truncate'>{q.client}</p>
				<p className='text-xs text-zinc-400'>
					{q.id} · {q.date}
				</p>
			</div>
			<div className='shrink-0 flex flex-col items-end gap-0.5'>
				{badge ? (
					<>
						<span
							className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${badge.bg} ${badge.text}`}
						>
							{badge.icon}
							{badge.label}
						</span>
						{q.status === 'approved' && (
							<span className='text-[10px] font-semibold text-emerald-600 pr-0.5'>
								+{fmt(q.premium * COMMISSION_RATE)}
							</span>
						)}
						{q.status === 'refused' && (
							<span className='text-[10px] text-zinc-400 pr-0.5'>
								{fmt(q.premium)}
							</span>
						)}
					</>
				) : (
					<span className='inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold bg-zinc-100 text-zinc-500'>
						{q.status === 'pending' && <Clock className='h-3 w-3' />}
						{q.status === 'in_analysis' && <AlertCircle className='h-3 w-3' />}
						{q.status === 'expired' && <Clock className='h-3 w-3' />}
						{q.status === 'pending'
							? 'Pendente'
							: q.status === 'in_analysis'
								? 'Em análise'
								: 'Expirada'}
					</span>
				)}
			</div>
		</div>
	);
}

function AllQuotationsSheet({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const months = groupByMonth(ALL_YEAR_QUOTATIONS, (q) => q.date);
	const approvedAll = ALL_YEAR_QUOTATIONS.filter(
		(q) => q.status === 'approved',
	);
	const annualCommission = approvedAll.reduce(
		(s, q) => s + q.premium * COMMISSION_RATE,
		0,
	);

	return (
		<BottomSheet
			open={open}
			onClose={onClose}
			title='Todas as cotações'
			subtitle={`${ALL_YEAR_QUOTATIONS.length} cotações · ano todo`}
			footer={
				<AnnualFooter
					count={approvedAll.length}
					label='aprovadas'
					commission={annualCommission}
				/>
			}
		>
			{months.map(({ key, label, items }) => {
				const monthCommission = items
					.filter((q) => q.status === 'approved')
					.reduce((s, q) => s + q.premium * COMMISSION_RATE, 0);
				return (
					<div key={key}>
						<MonthHeader label={label} commission={monthCommission} />
						<div className='divide-y divide-zinc-50 px-5'>
							{items.map((q) => (
								<QuotationRow key={q.id} q={q} />
							))}
						</div>
					</div>
				);
			})}
		</BottomSheet>
	);
}

// ─── All Insurances Sheet ─────────────────────────────────────────────────────

function AllInsurancesSheet({
	open,
	onClose,
}: {
	open: boolean;
	onClose: () => void;
}) {
	const months = groupByMonth(ALL_YEAR_INSURANCES, (i) => i.issueDate);
	const annualCommission = ALL_YEAR_INSURANCES.reduce(
		(s, i) => s + i.commission,
		0,
	);

	return (
		<BottomSheet
			open={open}
			onClose={onClose}
			title='Todos os seguros'
			subtitle={`${ALL_YEAR_INSURANCES.length} seguros · ano todo`}
			footer={
				<AnnualFooter
					count={ALL_YEAR_INSURANCES.length}
					label='seguros'
					commission={annualCommission}
				/>
			}
		>
			{months.map(({ key, label, items }) => {
				const monthCommission = items.reduce((s, i) => s + i.commission, 0);
				return (
					<div key={key}>
						<MonthHeader label={label} commission={monthCommission} />
						<div className='divide-y divide-zinc-50 px-5'>
							{items.map((ins) => {
								const initials =
									TYPE_INITIALS[ins.type] ?? ins.type.slice(0, 2).toUpperCase();
								return (
									<div key={ins.id} className='flex items-center gap-3.5 py-3'>
										<div className='h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-[11px] font-bold text-indigo-400 shrink-0'>
											{initials}
										</div>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium text-zinc-900 truncate'>
												{ins.client}
											</p>
											<p className='text-xs text-zinc-400'>
												{ins.id} · {ins.issueDate}
											</p>
										</div>
										<div className='flex flex-col items-end gap-1 shrink-0'>
											<span className='text-sm font-semibold text-zinc-800'>
												{fmt(ins.netPremium)}
											</span>
											<span className='text-[10px] font-semibold text-emerald-600'>
												+{fmt(ins.commission)}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				);
			})}
		</BottomSheet>
	);
}

// ─── CEP Sheet (replaces modal) ───────────────────────────────────────────────

function CepSheet({
	open,
	cep,
	state,
	onClose,
}: {
	open: boolean;
	cep: string;
	state: string;
	onClose: () => void;
}) {
	const yearInsurances = ALL_YEAR_INSURANCES.filter((i) => i.cep === cep);
	const months = groupByMonth(yearInsurances, (i) => i.issueDate);
	const annualCommission = yearInsurances.reduce((s, i) => s + i.commission, 0);
	const color = STATE_COLORS[state] ?? '#94a3b8';

	return (
		<BottomSheet
			open={open}
			onClose={onClose}
			title={cep}
			subtitle={`${state} · ${yearInsurances.length} seguro${yearInsurances.length !== 1 ? 's' : ''} no ano`}
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
			{months.length === 0 ? (
				<p className='text-xs text-zinc-400 text-center py-6'>
					Sem seguros no ano
				</p>
			) : (
				months.map(({ key, label, items }) => {
					const monthCommission = items.reduce((s, i) => s + i.commission, 0);
					return (
						<div key={key}>
							<MonthHeader label={label} commission={monthCommission} />
							<div className='divide-y divide-zinc-50 px-5'>
								{items.map((ins) => {
									const initials =
										TYPE_INITIALS[ins.type] ??
										ins.type.slice(0, 2).toUpperCase();
									return (
										<div
											key={ins.id}
											className='flex items-center gap-3.5 py-3'
										>
											<div
												className='h-9 w-9 rounded-xl flex items-center justify-center text-[11px] font-bold text-white shrink-0'
												style={{ background: color }}
											>
												{initials}
											</div>
											<div className='flex-1 min-w-0'>
												<p className='text-sm font-medium text-zinc-900 truncate'>
													{ins.client}
												</p>
												<p className='text-xs text-zinc-400'>
													{ins.id} · {ins.issueDate}
												</p>
											</div>
											<div className='flex flex-col items-end gap-1 shrink-0'>
												<span className='text-sm font-semibold text-zinc-800'>
													{fmt(ins.netPremium)}
												</span>
												<span className='text-[10px] font-semibold text-emerald-600'>
													+{fmt(ins.commission)}
												</span>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					);
				})
			)}
		</BottomSheet>
	);
}

// ─── CEP Listing ─────────────────────────────────────────────────────────────

function CepListing({ insurances }: { insurances: Insurance[] }) {
	const [selectedCep, setSelectedCep] = useState<{
		cep: string;
		state: string;
	} | null>(null);

	const grouped: Record<string, CepGroup> = {};
	for (const ins of insurances) {
		const cep = ins.cep ?? 'N/D';
		const state = ins.state ?? '';
		if (!grouped[cep]) grouped[cep] = { cep, state, count: 0, insurances: [] };
		grouped[cep].count++;
		grouped[cep].insurances.push(ins);
	}

	const entries = Object.values(grouped).sort((a, b) => b.count - a.count);
	const maxCount = Math.max(...entries.map((e) => e.count), 1);

	return (
		<>
			{selectedCep && (
				<CepSheet
					open={!!selectedCep}
					cep={selectedCep.cep}
					state={selectedCep.state}
					onClose={() => setSelectedCep(null)}
				/>
			)}

			<div className='divide-y divide-zinc-50 px-5'>
				{entries.map((group) => {
					const barPct = Math.round((group.count / maxCount) * 100);
					const color = STATE_COLORS[group.state] ?? '#94a3b8';
					return (
						<button
							key={group.cep}
							className='w-full flex items-center gap-3 py-3.5 text-left hover:bg-zinc-50 transition-colors'
							onClick={() =>
								setSelectedCep({ cep: group.cep, state: group.state })
							}
						>
							<div
								className='h-9 w-9 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shrink-0'
								style={{ background: color }}
							>
								{group.state}
							</div>
							<div className='flex-1 min-w-0'>
								<div className='flex items-center justify-between mb-1'>
									<span className='text-sm font-medium text-zinc-900'>
										{group.cep}
									</span>
									<span className='text-sm font-bold text-zinc-800'>
										{group.count} seguro{group.count !== 1 ? 's' : ''}
									</span>
								</div>
								<div className='h-1.5 bg-zinc-100 rounded-full overflow-hidden'>
									<div
										className='h-full rounded-full transition-all duration-500'
										style={{ width: `${barPct}%`, background: color }}
									/>
								</div>
							</div>
							<ArrowUpRight className='h-3.5 w-3.5 text-zinc-300 shrink-0' />
						</button>
					);
				})}
			</div>
			<div className='px-5 pb-4 pt-1'>
				<p className='text-[10px] text-zinc-400 text-center'>
					Toque em um CEP para ver seguros no ano todo
				</p>
			</div>
		</>
	);
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProducerDashboard() {
	const [hidden, setHidden] = useState(false);
	const [periodIdx, setPeriodIdx] = useState(PERIODS.length - 1);
	const [showAllQuotations, setShowAllQuotations] = useState(false);
	const [showAllInsurances, setShowAllInsurances] = useState(false);

	const period = PERIODS[periodIdx];
	const canPrev = periodIdx > 0;
	const canNext = periodIdx < PERIODS.length - 1;

	return (
		<div className='min-h-screen bg-zinc-50 font-sans'>
			{/* ── Global sheets ─────────────────────────────────────────────── */}
			<AllQuotationsSheet
				open={showAllQuotations}
				onClose={() => setShowAllQuotations(false)}
			/>
			<AllInsurancesSheet
				open={showAllInsurances}
				onClose={() => setShowAllInsurances(false)}
			/>

			{/* ── Hero Header ─────────────────────────────────────────────────── */}
			<div
				className='relative overflow-hidden px-5 pt-12 pb-8'
				style={{
					background: period.paid
						? 'linear-gradient(135deg, #052e16 0%, #14532d 60%, #052e16 100%)'
						: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
				}}
			>
				<div
					className='absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-20 blur-3xl'
					style={{ background: period.paid ? '#22c55e' : '#6366f1' }}
				/>
				<div
					className='absolute top-8 -left-12 h-36 w-36 rounded-full opacity-15 blur-3xl'
					style={{ background: period.paid ? '#4ade80' : '#8b5cf6' }}
				/>

				{/* Top bar */}
				<div className='relative flex items-center justify-between mb-8'>
					<div className='flex items-center gap-3'>
						<div
							className='h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0'
							style={{
								background: period.paid
									? 'rgba(34,197,94,0.85)'
									: 'rgba(99,102,241,0.9)',
							}}
						>
							{PRODUCER.avatar}
						</div>
						<div>
							<p className='text-white/50 text-[11px] leading-none mb-0.5 uppercase tracking-widest'>
								Produtor
							</p>
							<p className='text-white text-sm font-semibold leading-none'>
								{PRODUCER.name}
							</p>
						</div>
						<button
							className='ml-1 h-7 w-7 rounded-full flex items-center justify-center transition-colors'
							style={{
								background: 'rgba(255,255,255,0.08)',
								border: '1px solid rgba(255,255,255,0.12)',
							}}
							title='Sair'
							onClick={() => alert('Logout')}
						>
							<LogOut className='h-3.5 w-3.5 text-white/50' />
						</button>
					</div>

					<div
						className='flex items-center gap-1 rounded-full px-1 py-1'
						style={{
							background: 'rgba(255,255,255,0.08)',
							border: '1px solid rgba(255,255,255,0.1)',
						}}
					>
						<button
							onClick={() => canPrev && setPeriodIdx((i) => i - 1)}
							disabled={!canPrev}
							className='h-6 w-6 flex items-center justify-center rounded-full transition-colors disabled:opacity-30'
							style={{ color: 'rgba(255,255,255,0.7)' }}
						>
							<ChevronLeft className='h-3.5 w-3.5' />
						</button>
						<span className='text-white text-xs font-medium px-1 min-w-[88px] text-center'>
							{period.label}
						</span>
						<button
							onClick={() => canNext && setPeriodIdx((i) => i + 1)}
							disabled={!canNext}
							className='h-6 w-6 flex items-center justify-center rounded-full transition-colors disabled:opacity-30'
							style={{ color: 'rgba(255,255,255,0.7)' }}
						>
							<ChevronRight className='h-3.5 w-3.5' />
						</button>
					</div>
				</div>

				{/* Balance */}
				<div className='relative'>
					<div className='flex items-center gap-2 mb-1.5'>
						<p className='text-white/50 text-xs uppercase tracking-widest'>
							{period.paid ? 'Comissão paga' : 'Comissão a receber'}
						</p>
						<button
							onClick={() => setHidden((h) => !h)}
							className='text-white/30 hover:text-white/60 transition-colors'
						>
							{hidden ? (
								<EyeOff className='h-3.5 w-3.5' />
							) : (
								<Eye className='h-3.5 w-3.5' />
							)}
						</button>
					</div>

					<p className='text-4xl font-bold text-white tracking-tight mb-3'>
						{hidden ? 'R$ ••••••' : fmt(period.commission)}
					</p>

					{period.paid ? (
						<div
							className='inline-flex items-center gap-1.5 rounded-full px-3 py-1'
							style={{
								background: 'rgba(34,197,94,0.15)',
								border: '1px solid rgba(34,197,94,0.25)',
							}}
						>
							<CalendarCheck className='h-3 w-3 text-green-300' />
							<span className='text-xs text-green-300 font-medium'>
								Pago em {period.paidDate}
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
								Pagamento previsto para {period.paymentDate}
							</span>
						</div>
					)}

					{/* Quick stats */}
					<div className='relative grid grid-cols-3 gap-2 mt-7'>
						{[
							{
								icon: <FileText className='h-3.5 w-3.5' />,
								label: 'Cotações',
								value: String(period.totalQuotations),
							},
							{
								icon: <Shield className='h-3.5 w-3.5' />,
								label: 'Seguros',
								value: String(period.totalInsurances),
							},
							{
								icon: <BarChart3 className='h-3.5 w-3.5' />,
								label: 'Conversão',
								value: `${period.conversionRate}%`,
							},
						].map((chip) => (
							<div
								key={chip.label}
								className='rounded-xl px-3 py-2.5 flex flex-col gap-1'
								style={{
									background: 'rgba(255,255,255,0.07)',
									backdropFilter: 'blur(8px)',
									border: '1px solid rgba(255,255,255,0.08)',
								}}
							>
								<div className='flex items-center gap-1.5 text-white/50'>
									{chip.icon}
									<span className='text-[10px] uppercase tracking-wider'>
										{chip.label}
									</span>
								</div>
								<span className='text-white text-sm font-bold'>
									{chip.value}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* ── Body ────────────────────────────────────────────────────────── */}
			<div className='flex flex-col gap-3 px-4 py-4 max-w-lg mx-auto'>
				{/* Donut */}
				<FadeIn animKey={periodIdx}>
					<QuotationDonut
						statusMap={period.quotationStatus}
						total={period.totalQuotations}
						animKey={periodIdx}
					/>
				</FadeIn>

				{/* Histórico com 3 abas */}
				<FadeIn animKey={periodIdx}>
					<div className='rounded-2xl bg-white shadow-sm border border-zinc-100 overflow-hidden'>
						<Tabs defaultValue='quotations'>
							<div className='px-5 pt-4 pb-0'>
								<p className='text-[11px] text-zinc-400 uppercase tracking-widest mb-3'>
									Histórico recente
								</p>
								<TabsList className='w-full bg-zinc-100 rounded-xl p-0.5 h-9'>
									<TabsTrigger
										value='quotations'
										className='flex-1 text-xs rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm'
									>
										Cotações
									</TabsTrigger>
									<TabsTrigger
										value='insurances'
										className='flex-1 text-xs rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm'
									>
										Seguros
									</TabsTrigger>
									<TabsTrigger
										value='cep'
										className='flex-1 text-xs rounded-lg h-full data-[state=active]:bg-white data-[state=active]:shadow-sm'
									>
										Por CEP
									</TabsTrigger>
								</TabsList>
							</div>

							{/* Tab: Cotações */}
							<TabsContent value='quotations' className='mt-0'>
								<div className='divide-y divide-zinc-50 px-5'>
									{period.quotations.map((q) => (
										<QuotationRow key={q.id} q={q} />
									))}
								</div>
								<div className='px-5 pb-4 pt-1'>
									<button
										className='w-full text-xs text-indigo-600 font-medium flex items-center justify-center gap-1 py-2 hover:text-indigo-700 transition-colors'
										onClick={() => setShowAllQuotations(true)}
									>
										Ver todas as cotações
										<ArrowUpRight className='h-3.5 w-3.5' />
									</button>
								</div>
							</TabsContent>

							{/* Tab: Seguros */}
							<TabsContent value='insurances' className='mt-0'>
								<div className='divide-y divide-zinc-50 px-5'>
									{period.insurances.map((ins) => {
										const initials =
											TYPE_INITIALS[ins.type] ??
											ins.type.slice(0, 2).toUpperCase();
										return (
											<div
												key={ins.id}
												className='flex items-center gap-3.5 py-3.5'
											>
												<div className='h-9 w-9 rounded-xl bg-indigo-50 flex items-center justify-center text-[11px] font-bold text-indigo-400 shrink-0'>
													{initials}
												</div>
												<div className='flex-1 min-w-0'>
													<p className='text-sm font-medium text-zinc-900 truncate'>
														{ins.client}
													</p>
													<p className='text-xs text-zinc-400'>
														{ins.id} · {ins.issueDate}
													</p>
												</div>
												<div className='flex flex-col items-end gap-1 shrink-0'>
													<span className='text-sm font-semibold text-zinc-800'>
														{fmt(ins.netPremium)}
													</span>
													<span className='text-[10px] font-semibold text-emerald-600'>
														+{fmt(ins.commission)}
													</span>
												</div>
											</div>
										);
									})}
								</div>
								<div className='px-5 pb-4 pt-1'>
									<button
										className='w-full text-xs text-indigo-600 font-medium flex items-center justify-center gap-1 py-2 hover:text-indigo-700 transition-colors'
										onClick={() => setShowAllInsurances(true)}
									>
										Ver todos os seguros
										<ArrowUpRight className='h-3.5 w-3.5' />
									</button>
								</div>
							</TabsContent>

							{/* Tab: Por CEP */}
							<TabsContent value='cep' className='mt-0'>
								<CepListing insurances={period.insurances} />
							</TabsContent>
						</Tabs>
					</div>
				</FadeIn>

				<p className='text-center text-[11px] text-zinc-400 pb-6'>
					{PRODUCER.code} · {period.label}
				</p>
			</div>
		</div>
	);
}
