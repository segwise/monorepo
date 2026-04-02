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
	Shield,
	Wallet,
	XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Separator } from '@/components/ui/separator';
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
};

type Insurance = {
	id: string;
	client: string;
	type: string;
	netPremium: number;
	commission: number;
	issueDate: string;
};

type Period = {
	label: string; // e.g. "Abril 2025"
	month: number; // 1–12
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
	// Payment state
	paid: boolean;
	paidDate?: string; // filled when paid === true
	paymentDate?: string; // scheduled date when paid === false
	commission: number; // amount paid (if paid) or amount pending (if not)
	// Data
	quotationStatus: QuotationStatusMap;
	quotations: Quotation[];
	insurances: Insurance[];
};

// ─── Placeholder Data (replace with your logic) ───────────────────────────────

const PRODUCER = {
	name: 'João Silva',
	code: 'PROD-0042',
	avatar: 'JS',
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
			},
			{
				id: 'COT-1049',
				client: 'Marcos Lima',
				type: 'Auto',
				premium: 3400,
				status: 'approved',
				date: '08/02/2025',
			},
			{
				id: 'COT-1048',
				client: 'Luana Ferraz',
				type: 'Residencial',
				premium: 1100,
				status: 'refused',
				date: '05/02/2025',
			},
			{
				id: 'COT-1047',
				client: 'Diego Nunes',
				type: 'Empresarial',
				premium: 6500,
				status: 'approved',
				date: '02/02/2025',
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
			},
			{
				id: 'APL-5799',
				client: 'Marcos Lima',
				type: 'Auto',
				netPremium: 3060,
				commission: 459,
				issueDate: '09/02/2025',
			},
			{
				id: 'APL-5798',
				client: 'Diego Nunes',
				type: 'Empresarial',
				netPremium: 5850,
				commission: 877.5,
				issueDate: '03/02/2025',
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
			},
			{
				id: 'COT-1079',
				client: 'Clara Duarte',
				type: 'Residencial',
				premium: 1250,
				status: 'approved',
				date: '25/03/2025',
			},
			{
				id: 'COT-1078',
				client: 'Felipe Torres',
				type: 'Vida',
				premium: 760,
				status: 'pending',
				date: '22/03/2025',
			},
			{
				id: 'COT-1077',
				client: 'Amanda Sousa',
				type: 'Empresarial',
				premium: 8200,
				status: 'approved',
				date: '18/03/2025',
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
			},
			{
				id: 'APL-5809',
				client: 'Clara Duarte',
				type: 'Residencial',
				netPremium: 1125,
				commission: 168.75,
				issueDate: '26/03/2025',
			},
			{
				id: 'APL-5808',
				client: 'Amanda Sousa',
				type: 'Empresarial',
				netPremium: 7380,
				commission: 1107,
				issueDate: '19/03/2025',
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
			},
			{
				id: 'COT-1090',
				client: 'Fernanda Lima',
				type: 'Vida',
				premium: 890,
				status: 'pending',
				date: '31/03/2025',
			},
			{
				id: 'COT-1089',
				client: 'Carlos Souza',
				type: 'Residencial',
				premium: 1350,
				status: 'in_analysis',
				date: '30/03/2025',
			},
			{
				id: 'COT-1088',
				client: 'Renata Alves',
				type: 'Empresarial',
				premium: 7800,
				status: 'refused',
				date: '28/03/2025',
			},
			{
				id: 'COT-1087',
				client: 'Paulo Mendes',
				type: 'Auto',
				premium: 3100,
				status: 'approved',
				date: '27/03/2025',
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
			},
			{
				id: 'APL-5820',
				client: 'Paulo Mendes',
				type: 'Auto',
				netPremium: 2790,
				commission: 418.5,
				issueDate: '28/03/2025',
			},
			{
				id: 'APL-5819',
				client: 'Ana Costa',
				type: 'Residencial',
				netPremium: 1215,
				commission: 182.25,
				issueDate: '25/03/2025',
			},
			{
				id: 'APL-5818',
				client: 'Bruno Ferreira',
				type: 'Vida',
				netPremium: 801,
				commission: 120.15,
				issueDate: '20/03/2025',
			},
		],
	},
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number) {
	return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fmtShort(value: number) {
	if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`;
	return fmt(value);
}

const STATUS_CONFIG: Record<
	QuotationStatus,
	{ icon: React.ReactNode; color: string; dot: string }
> = {
	approved: {
		icon: <CheckCircle2 className='h-3.5 w-3.5' />,
		color: 'text-emerald-600',
		dot: 'bg-emerald-500',
	},
	pending: {
		icon: <Clock className='h-3.5 w-3.5' />,
		color: 'text-amber-500',
		dot: 'bg-amber-400',
	},
	in_analysis: {
		icon: <AlertCircle className='h-3.5 w-3.5' />,
		color: 'text-blue-500',
		dot: 'bg-blue-400',
	},
	refused: {
		icon: <XCircle className='h-3.5 w-3.5' />,
		color: 'text-red-500',
		dot: 'bg-red-400',
	},
	expired: {
		icon: <Clock className='h-3.5 w-3.5' />,
		color: 'text-zinc-400',
		dot: 'bg-zinc-300',
	},
};

const TYPE_INITIALS: Record<string, string> = {
	Auto: 'AU',
	Vida: 'VI',
	Residencial: 'RE',
	Empresarial: 'EM',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProducerDashboard() {
	const [hidden, setHidden] = useState(false);
	const [periodIdx, setPeriodIdx] = useState(PERIODS.length - 1);

	const period = PERIODS[periodIdx];
	const canPrev = periodIdx > 0;
	const canNext = periodIdx < PERIODS.length - 1;

	const quotationGoalPct = Math.min(
		Math.round((period.totalQuotations / period.goalQuotations) * 100),
		100,
	);
	const premiumGoalPct = Math.min(
		Math.round((period.netPremium / period.goalPremium) * 100),
		100,
	);

	return (
		<div className='min-h-screen bg-zinc-50 font-sans'>
			{/* ── Hero Header ────────────────────────────────────────────────────── */}
			<div
				className='relative overflow-hidden px-5 pt-12 pb-8'
				style={{
					background: period.paid
						? 'linear-gradient(135deg, #052e16 0%, #14532d 60%, #052e16 100%)'
						: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
				}}
			>
				{/* Glow blobs */}
				<div
					className='absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-20 blur-3xl'
					style={{ background: period.paid ? '#22c55e' : '#6366f1' }}
				/>
				<div
					className='absolute top-8 -left-12 h-36 w-36 rounded-full opacity-15 blur-3xl'
					style={{ background: period.paid ? '#4ade80' : '#8b5cf6' }}
				/>

				{/* Top bar: producer + period navigator */}
				<div className='relative flex items-center justify-between mb-8'>
					<div className='flex items-center gap-3'>
						<div
							className='h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white'
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
					</div>

					{/* Period Navigator */}
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

				{/* Balance block — adapts to paid/pending */}
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

					{/* Payment status badge */}
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
				</div>

				{/* Quick stats chips */}
				<div className='relative flex gap-2.5 mt-7 overflow-x-auto pb-1 scrollbar-none'>
					{[
						{
							icon: <FileText className='h-3.5 w-3.5' />,
							label: 'Cotações',
							value: String(period.totalQuotations),
						},
						{
							icon: <Shield className='h-3.5 w-3.5' />,
							label: 'Apólices',
							value: String(period.totalInsurances),
						},
						{
							icon: <BarChart3 className='h-3.5 w-3.5' />,
							label: 'Conversão',
							value: `${period.conversionRate}%`,
						},
						{
							icon: <Wallet className='h-3.5 w-3.5' />,
							label: 'Prêmio',
							value: fmtShort(period.netPremium),
						},
					].map((chip) => (
						<div
							key={chip.label}
							className='flex-none rounded-xl px-3.5 py-2.5 flex flex-col gap-1'
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
							<span className='text-white text-sm font-bold'>{chip.value}</span>
						</div>
					))}
				</div>
			</div>

			{/* ── Body ───────────────────────────────────────────────────────────── */}
			<div className='flex flex-col gap-3 px-4 py-4 max-w-lg mx-auto'>
				{/* ── Goals ─────────────────────────────────────────────────────── */}
				<div className='rounded-2xl bg-white shadow-sm border border-zinc-100 px-5 py-4'>
					<p className='text-[11px] text-zinc-400 uppercase tracking-widest mb-4'>
						Metas do período
					</p>
					<div className='flex flex-col gap-4'>
						<div className='flex flex-col gap-1.5'>
							<div className='flex justify-between items-baseline'>
								<span className='text-sm text-zinc-600'>Cotações</span>
								<span className='text-sm font-semibold text-zinc-800'>
									{period.totalQuotations}
									<span className='text-zinc-400 font-normal'>
										{' '}
										/ {period.goalQuotations}
									</span>
								</span>
							</div>
							<div className='relative h-2 w-full rounded-full bg-zinc-100 overflow-hidden'>
								<div
									className='absolute inset-y-0 left-0 rounded-full transition-all'
									style={{
										width: `${quotationGoalPct}%`,
										background: period.paid ? '#22c55e' : '#6366f1',
									}}
								/>
							</div>
							<p className='text-[11px] text-zinc-400 text-right'>
								{quotationGoalPct}% da meta
							</p>
						</div>
						<Separator />
						<div className='flex flex-col gap-1.5'>
							<div className='flex justify-between items-baseline'>
								<span className='text-sm text-zinc-600'>Prêmio líquido</span>
								<span className='text-sm font-semibold text-zinc-800'>
									{fmtShort(period.netPremium)}
									<span className='text-zinc-400 font-normal'>
										{' '}
										/ {fmtShort(period.goalPremium)}
									</span>
								</span>
							</div>
							<div className='relative h-2 w-full rounded-full bg-zinc-100 overflow-hidden'>
								<div
									className='absolute inset-y-0 left-0 rounded-full transition-all'
									style={{
										width: `${premiumGoalPct}%`,
										background: period.paid ? '#22c55e' : '#6366f1',
									}}
								/>
							</div>
							<p className='text-[11px] text-zinc-400 text-right'>
								{premiumGoalPct}% da meta
							</p>
						</div>
					</div>
				</div>

				{/* ── Quotation Status ───────────────────────────────────────────── */}
				<div className='rounded-2xl bg-white shadow-sm border border-zinc-100 px-5 py-4'>
					<div className='flex items-center justify-between mb-4'>
						<p className='text-[11px] text-zinc-400 uppercase tracking-widest'>
							Cotações por status
						</p>
						<span className='text-xs font-semibold text-zinc-500'>
							{period.totalQuotations} total
						</span>
					</div>

					{/* Segmented bar */}
					<div className='flex h-3 w-full rounded-full overflow-hidden gap-px mb-4'>
						{(
							Object.entries(period.quotationStatus) as [
								QuotationStatus,
								{ label: string; count: number },
							][]
						).map(([key, s]) => {
							const pct = (s.count / period.totalQuotations) * 100;
							const cfg = STATUS_CONFIG[key];
							return (
								<div
									key={key}
									className={`h-full ${cfg.dot} first:rounded-l-full last:rounded-r-full`}
									style={{ width: `${pct}%` }}
									title={`${s.label}: ${s.count}`}
								/>
							);
						})}
					</div>

					{/* Legend */}
					<div className='flex flex-wrap gap-x-4 gap-y-2'>
						{(
							Object.entries(period.quotationStatus) as [
								QuotationStatus,
								{ label: string; count: number },
							][]
						).map(([key, s]) => {
							const cfg = STATUS_CONFIG[key];
							const pct = Math.round((s.count / period.totalQuotations) * 100);
							return (
								<div key={key} className='flex items-center gap-1.5'>
									<div className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
									<span className='text-xs text-zinc-500'>{s.label}</span>
									<span className='text-xs font-semibold text-zinc-800'>
										{s.count}
										<span className='text-zinc-400 font-normal'> ({pct}%)</span>
									</span>
								</div>
							);
						})}
					</div>
				</div>

				{/* ── Recent activity ────────────────────────────────────────────── */}
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
									Apólices
								</TabsTrigger>
							</TabsList>
						</div>

						<TabsContent value='quotations' className='mt-0'>
							<div className='divide-y divide-zinc-50 px-5'>
								{period.quotations.map((q) => {
									const cfg = STATUS_CONFIG[q.status];
									const initials =
										TYPE_INITIALS[q.type] ?? q.type.slice(0, 2).toUpperCase();
									return (
										<div
											key={q.id}
											className='flex items-center gap-3.5 py-3.5'
										>
											<div className='h-9 w-9 rounded-xl bg-zinc-100 flex items-center justify-center text-[11px] font-bold text-zinc-500 shrink-0'>
												{initials}
											</div>
											<div className='flex-1 min-w-0'>
												<p className='text-sm font-medium text-zinc-900 truncate'>
													{q.client}
												</p>
												<p className='text-xs text-zinc-400'>
													{q.id} · {q.date}
												</p>
											</div>
											<div className='flex flex-col items-end gap-1 shrink-0'>
												<span className='text-sm font-semibold text-zinc-800'>
													{fmt(q.premium)}
												</span>
												<span
													className={`flex items-center gap-0.5 text-[10px] font-medium ${cfg.color}`}
												>
													{cfg.icon}
													{period.quotationStatus[q.status].label}
												</span>
											</div>
										</div>
									);
								})}
							</div>
							<div className='px-5 pb-4 pt-1'>
								<button className='w-full text-xs text-indigo-600 font-medium flex items-center justify-center gap-1 py-2 hover:text-indigo-700 transition-colors'>
									Ver todas as cotações
									<ArrowUpRight className='h-3.5 w-3.5' />
								</button>
							</div>
						</TabsContent>

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
								<button className='w-full text-xs text-indigo-600 font-medium flex items-center justify-center gap-1 py-2 hover:text-indigo-700 transition-colors'>
									Ver todas as apólices
									<ArrowUpRight className='h-3.5 w-3.5' />
								</button>
							</div>
						</TabsContent>
					</Tabs>
				</div>

				<p className='text-center text-[11px] text-zinc-400 pb-6'>
					{PRODUCER.code} · {period.label}
				</p>
			</div>
		</div>
	);
}
