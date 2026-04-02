'use client';

import {
	AlertCircle,
	ArrowUpRight,
	BarChart3,
	CheckCircle2,
	Clock,
	Eye,
	EyeOff,
	FileText,
	Shield,
	TrendingDown,
	TrendingUp,
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

// ─── Placeholder Data (replace with your logic) ───────────────────────────────

const PRODUCER = {
	name: 'João Silva',
	code: 'PROD-0042',
	period: 'Abril 2025',
	avatar: 'JS',
};

const SUMMARY = {
	totalQuotations: 48,
	totalInsurances: 21,
	netPremium: 187430.5,
	totalCommission: 28114.57,
	commissionReceived: 19800.0,
	commissionPending: 8314.57,
	commissionRate: 15,
	goalQuotations: 60,
	goalPremium: 250000,
	conversionRate: 43.75,
	vsLastMonth: +12.4,
};

const QUOTATION_STATUS: Record<
	QuotationStatus,
	{ label: string; count: number }
> = {
	approved: { label: 'Aprovadas', count: 21 },
	pending: { label: 'Pendentes', count: 8 },
	in_analysis: { label: 'Em análise', count: 5 },
	refused: { label: 'Recusadas', count: 9 },
	expired: { label: 'Expiradas', count: 5 },
};

const RECENT_QUOTATIONS: Quotation[] = [
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
];

const RECENT_INSURANCES: Insurance[] = [
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
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(value: number) {
	return value.toLocaleString('pt-BR', {
		style: 'currency',
		currency: 'BRL',
	});
}

function fmtShort(value: number) {
	if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1)}M`;
	if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(1)}K`;
	return fmt(value);
}

function mask(value: string) {
	return 'R$ ••••••';
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

	const receivedPct = Math.round(
		(SUMMARY.commissionReceived / SUMMARY.totalCommission) * 100,
	);
	const quotationGoalPct = Math.min(
		Math.round((SUMMARY.totalQuotations / SUMMARY.goalQuotations) * 100),
		100,
	);
	const premiumGoalPct = Math.min(
		Math.round((SUMMARY.netPremium / SUMMARY.goalPremium) * 100),
		100,
	);

	return (
		<div className='min-h-screen bg-zinc-50 font-sans'>
			{/* ── Hero Header ────────────────────────────────────────────────────── */}
			<div
				className='relative overflow-hidden px-5 pt-12 pb-8'
				style={{
					background:
						'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
				}}
			>
				{/* Subtle glow blobs */}
				<div
					className='absolute -top-16 -right-16 h-48 w-48 rounded-full opacity-20 blur-3xl'
					style={{ background: '#6366f1' }}
				/>
				<div
					className='absolute top-8 -left-12 h-36 w-36 rounded-full opacity-15 blur-3xl'
					style={{ background: '#8b5cf6' }}
				/>

				{/* Top bar */}
				<div className='relative flex items-center justify-between mb-8'>
					<div className='flex items-center gap-3'>
						<div
							className='h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white'
							style={{ background: 'rgba(99,102,241,0.9)' }}
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
					<span className='text-white/40 text-xs border border-white/10 rounded-full px-2.5 py-1'>
						{PRODUCER.period}
					</span>
				</div>

				{/* Balance block */}
				<div className='relative'>
					<div className='flex items-center gap-2 mb-1.5'>
						<p className='text-white/50 text-xs uppercase tracking-widest'>
							Prêmio líquido gerado
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
					<p className='text-4xl font-bold text-white tracking-tight mb-2'>
						{hidden
							? mask(String(SUMMARY.netPremium))
							: fmtShort(SUMMARY.netPremium)}
					</p>
					<div className='flex items-center gap-1.5'>
						{SUMMARY.vsLastMonth >= 0 ? (
							<TrendingUp className='h-3.5 w-3.5 text-emerald-400' />
						) : (
							<TrendingDown className='h-3.5 w-3.5 text-red-400' />
						)}
						<span
							className={`text-xs font-semibold ${
								SUMMARY.vsLastMonth >= 0 ? 'text-emerald-400' : 'text-red-400'
							}`}
						>
							{SUMMARY.vsLastMonth >= 0 ? '+' : ''}
							{SUMMARY.vsLastMonth}% vs mês anterior
						</span>
					</div>
				</div>

				{/* Quick stats chips */}
				<div className='relative flex gap-2.5 mt-7 overflow-x-auto pb-1 scrollbar-none'>
					{[
						{
							icon: <FileText className='h-3.5 w-3.5' />,
							label: 'Cotações',
							value: String(SUMMARY.totalQuotations),
						},
						{
							icon: <Shield className='h-3.5 w-3.5' />,
							label: 'Apólices',
							value: String(SUMMARY.totalInsurances),
						},
						{
							icon: <BarChart3 className='h-3.5 w-3.5' />,
							label: 'Conversão',
							value: `${SUMMARY.conversionRate}%`,
						},
						{
							icon: <Wallet className='h-3.5 w-3.5' />,
							label: 'Comissão',
							value: fmtShort(SUMMARY.totalCommission),
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
				{/* ── Commission Card ───────────────────────────────────────────── */}
				<div className='rounded-2xl bg-white shadow-sm border border-zinc-100 overflow-hidden'>
					<div className='px-5 pt-5 pb-4'>
						<div className='flex items-start justify-between mb-4'>
							<div>
								<p className='text-[11px] text-zinc-400 uppercase tracking-widest mb-1'>
									Comissão gerada
								</p>
								<p className='text-2xl font-bold text-zinc-900'>
									{hidden ? 'R$ ••••••' : fmt(SUMMARY.totalCommission)}
								</p>
								<p className='text-xs text-zinc-400 mt-0.5'>
									Taxa de {SUMMARY.commissionRate}% sobre o prêmio
								</p>
							</div>
							<div className='h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center'>
								<Wallet className='h-5 w-5 text-indigo-600' />
							</div>
						</div>

						{/* Progress bar */}
						<div className='flex flex-col gap-1.5 mb-4'>
							<div className='flex justify-between text-xs text-zinc-500'>
								<span>Recebido</span>
								<span className='font-medium text-zinc-700'>
									{receivedPct}%
								</span>
							</div>
							<div className='relative h-2.5 w-full rounded-full bg-zinc-100 overflow-hidden'>
								<div
									className='absolute inset-y-0 left-0 rounded-full'
									style={{
										width: `${receivedPct}%`,
										background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
									}}
								/>
							</div>
						</div>

						{/* Two blocks */}
						<div className='grid grid-cols-2 gap-2.5'>
							<div className='rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3'>
								<p className='text-[10px] text-emerald-600 uppercase tracking-wider font-semibold mb-1'>
									Recebida
								</p>
								<p className='text-base font-bold text-emerald-700'>
									{hidden ? 'R$ ••••' : fmt(SUMMARY.commissionReceived)}
								</p>
							</div>
							<div className='rounded-xl bg-amber-50 border border-amber-100 px-4 py-3'>
								<p className='text-[10px] text-amber-600 uppercase tracking-wider font-semibold mb-1'>
									A receber
								</p>
								<p className='text-base font-bold text-amber-700'>
									{hidden ? 'R$ ••••' : fmt(SUMMARY.commissionPending)}
								</p>
							</div>
						</div>
					</div>
				</div>

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
									{SUMMARY.totalQuotations}
									<span className='text-zinc-400 font-normal'>
										{' '}
										/ {SUMMARY.goalQuotations}
									</span>
								</span>
							</div>
							<div className='relative h-2 w-full rounded-full bg-zinc-100 overflow-hidden'>
								<div
									className='absolute inset-y-0 left-0 rounded-full bg-indigo-500 transition-all'
									style={{ width: `${quotationGoalPct}%` }}
								/>
							</div>
						</div>
						<Separator />
						<div className='flex flex-col gap-1.5'>
							<div className='flex justify-between items-baseline'>
								<span className='text-sm text-zinc-600'>Prêmio líquido</span>
								<span className='text-sm font-semibold text-zinc-800'>
									{fmtShort(SUMMARY.netPremium)}
									<span className='text-zinc-400 font-normal'>
										{' '}
										/ {fmtShort(SUMMARY.goalPremium)}
									</span>
								</span>
							</div>
							<div className='relative h-2 w-full rounded-full bg-zinc-100 overflow-hidden'>
								<div
									className='absolute inset-y-0 left-0 rounded-full bg-indigo-500 transition-all'
									style={{ width: `${premiumGoalPct}%` }}
								/>
							</div>
						</div>
					</div>
				</div>

				{/* ── Quotation Status ───────────────────────────────────────────── */}
				<div className='rounded-2xl bg-white shadow-sm border border-zinc-100 px-5 py-4'>
					<p className='text-[11px] text-zinc-400 uppercase tracking-widest mb-4'>
						Cotações por status
					</p>
					<div className='flex flex-col gap-0 divide-y divide-zinc-50'>
						{(
							Object.entries(QUOTATION_STATUS) as [
								QuotationStatus,
								(typeof QUOTATION_STATUS)[QuotationStatus],
							][]
						).map(([key, s]) => {
							const cfg = STATUS_CONFIG[key];
							const pct = Math.round((s.count / SUMMARY.totalQuotations) * 100);
							return (
								<div
									key={key}
									className='flex items-center gap-3 py-2.5 first:pt-0 last:pb-0'
								>
									<div className={`h-2 w-2 rounded-full shrink-0 ${cfg.dot}`} />
									<span className='text-sm text-zinc-600 flex-1'>
										{s.label}
									</span>
									<div className='flex items-center gap-2.5'>
										<div className='w-20 h-1.5 rounded-full bg-zinc-100 overflow-hidden'>
											<div
												className={`h-full rounded-full ${cfg.dot}`}
												style={{ width: `${pct}%` }}
											/>
										</div>
										<span className='text-sm font-semibold text-zinc-800 w-5 text-right'>
											{s.count}
										</span>
									</div>
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
								{RECENT_QUOTATIONS.map((q) => {
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
													{QUOTATION_STATUS[q.status].label}
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
								{RECENT_INSURANCES.map((ins) => {
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
					{PRODUCER.code} · Dados de {PRODUCER.period}
				</p>
			</div>
		</div>
	);
}
