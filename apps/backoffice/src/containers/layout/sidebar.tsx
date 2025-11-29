'use client';

import {
	BarChart3,
	Building2,
	Calendar,
	CheckSquare,
	ChevronDown,
	ChevronRight,
	FileText,
	HelpCircle,
	LayoutDashboard,
	Plus,
	Search,
	Settings,
	Shield,
	Target,
	Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils';

interface SidebarProps {
	className?: string;
}

export function CRMSidebar({ className }: SidebarProps) {
	const [gestaoExpanded, setGestaoExpanded] = useState(true);
	const [configExpanded, setConfigExpanded] = useState(true);
	const pathname = usePathname();

	return (
		<div
			className={cn('w-[266px] flex flex-col h-screen', className)}
			style={{ backgroundColor: '#1E293B' }}
		>
			{/* Logo */}
			<div className='p-4 flex items-center gap-3'>
				<div className='size-8 rounded-lg bg-[#6366F1] flex items-center justify-center'>
					<Shield className='size-5 text-white' />
				</div>
				<span className='text-white font-semibold text-lg'>LeadSeguro</span>
				<ChevronDown className='ml-auto size-4 text-[#94A3B8]' />
			</div>

			{/* Main Navigation */}
			<nav className='flex-1 px-3 py-2 overflow-y-auto'>
				<div className='space-y-1'>
					<SidebarItem
						icon={LayoutDashboard}
						label='Dashboard'
						href='/'
						active={pathname === '/'}
					/>
					<SidebarItem
						icon={CheckSquare}
						label='Tarefas'
						href='/tarefas'
						badge={1}
						active={pathname === '/tarefas'}
					/>
					<SidebarItem
						icon={Calendar}
						label='Calendário'
						href='/calendario'
						active={pathname === '/calendario'}
					/>
				</div>

				<div className='mt-6'>
					<Button
						onClick={() => setGestaoExpanded(!gestaoExpanded)}
						className='w-full flex items-center justify-between px-3 py-2 text-[#94A3B8] text-sm font-medium hover:text-[#F1F5F9] transition-colors'
					>
						<span>Gestão de Leads</span>
						<div className='flex items-center gap-2'>
							<Button
								variant='ghost'
								size='icon'
								className='size-5 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#334155]'
							>
								<Search className='size-3.5' />
							</Button>
							<Button
								variant='ghost'
								size='icon'
								className='size-5 text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#334155]'
							>
								<Plus className='size-3.5' />
							</Button>
						</div>
					</Button>
					{gestaoExpanded && (
						<div className='space-y-1 mt-1'>
							<SidebarItem
								icon={Target}
								label='Leads'
								href='/leads'
								active={pathname === '/leads'}
							/>
							<SidebarItem
								icon={Building2}
								label='Corretoras'
								href='/corretoras'
								active={pathname === '/corretoras'}
							/>
							<SidebarItem
								icon={Shield}
								label='Seguros Emitidos'
								href='/seguros-emitidos'
								active={pathname === '/seguros-emitidos'}
							/>
							<SidebarItem
								icon={Users}
								label='Seguradoras'
								href='/seguradoras'
								active={pathname === '/seguradoras'}
							/>
						</div>
					)}
				</div>

				<div className='mt-6'>
					<Button
						onClick={() => setConfigExpanded(!configExpanded)}
						className='w-full flex items-center justify-between px-3 py-2 text-[#94A3B8] text-sm font-medium hover:text-[#F1F5F9] transition-colors'
					>
						<span>Configurações</span>
					</Button>
					{configExpanded && (
						<div className='space-y-1 mt-1'>
							<SidebarItem
								icon={BarChart3}
								label='Relatórios'
								href='/relatorios'
								active={pathname === '/relatorios'}
							/>
							<SidebarItem
								icon={FileText}
								label='Integrações'
								href='/integracoes'
								active={pathname === '/integracoes'}
							/>
							<SidebarItem
								icon={Users}
								label='Usuários'
								href='/usuarios'
								active={pathname === '/usuarios'}
							/>
						</div>
					)}
				</div>
			</nav>

			{/* Bottom Section */}
			<div className='border-t border-[#334155] p-3 space-y-1'>
				<SidebarItem
					icon={HelpCircle}
					label='Ajuda e Suporte'
					href='/ajuda'
					active={pathname === '/ajuda'}
				/>
				<SidebarItem
					icon={Settings}
					label='Configurações'
					href='/configuracoes'
					active={pathname === '/configuracoes'}
				/>
			</div>

			{/* User Profile */}
			<div className='p-3 border-t border-[#334155] flex items-center gap-3 hover:bg-[#334155] cursor-pointer transition-colors'>
				<Avatar className='size-8'>
					<AvatarImage src='/placeholder.svg?height=32&width=32' alt='' />
					<AvatarFallback className='bg-[#6366F1] text-white text-xs'>
						AD
					</AvatarFallback>
				</Avatar>
				<div className='flex-1 min-w-0'>
					<p className='text-white text-sm font-medium truncate'>Admin</p>
					<p className='text-[#94A3B8] text-xs truncate'>
						admin@leadseguro.com
					</p>
				</div>
				<ChevronRight className='size-4 text-[#94A3B8]' />
			</div>
		</div>
	);
}

interface SidebarItemProps {
	// biome-ignore lint/suspicious/noExplicitAny: icon
	icon: any;
	label: string;
	href?: string;
	active?: boolean;
	badge?: number;
}

function SidebarItem({
	icon: Icon,
	label,
	href,
	active,
	badge,
}: SidebarItemProps) {
	const content = (
		<>
			<Icon className='size-4' />
			<span className='flex-1 text-left'>{label}</span>
			{badge && (
				<span className='bg-red-500 text-white text-xs size-5 rounded-full flex items-center justify-center'>
					{badge}
				</span>
			)}
		</>
	);

	const className = cn(
		'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
		active
			? 'bg-[#334155] text-[#F1F5F9]'
			: 'text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-[#334155]',
	);

	if (href) {
		return (
			<Link href={href} className={className}>
				{content}
			</Link>
		);
	}

	return <Button className={className}>{content}</Button>;
}
