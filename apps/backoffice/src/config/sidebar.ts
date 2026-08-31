import {
	BanknoteArrowUpIcon,
	BriefcaseBusinessIcon,
	Building2Icon,
	FileChartColumnIcon,
	FileJsonIcon,
	FileTextIcon,
	FileUserIcon,
	FileXIcon,
	GaugeIcon,
	HandCoinsIcon,
	LandmarkIcon,
	LayoutDashboardIcon,
	UserStarIcon,
	Users2Icon,
	UsersRoundIcon,
} from 'lucide-react';

const sidebar: Array<{
	label: string;
	items: Array<{
		title: string;
		pathname: string;
		icon: typeof LayoutDashboardIcon;
		disabled?: boolean;
	}>;
}> =
	process.env.NEXT_PUBLIC_ROLE_SYSTEM === 'admin'
		? [
				{
					label: 'Visão Geral',
					items: [
						{
							title: 'Dashboard',
							pathname: '/dashboard',
							icon: LayoutDashboardIcon,
							disabled: true,
						},
					],
				},
				{
					label: 'Comercial',
					items: [
						{
							title: 'Clientes',
							pathname: '/customers',
							icon: Users2Icon,
							disabled: true,
						},
						{
							title: 'Corretoras',
							pathname: '/brokers',
							icon: BriefcaseBusinessIcon,
							disabled: true,
						},
						{
							title: 'Seguradoras',
							pathname: '/insurance-companies',
							icon: Building2Icon,
							disabled: true,
						},
					],
				},
				{
					label: 'Planos',
					items: [
						{
							title: 'Assinaturas',
							pathname: '/signatures',
							icon: FileTextIcon,
							disabled: true,
						},
						{
							title: 'Controle de Planos',
							pathname: '/plans',
							icon: FileXIcon,
							disabled: true,
						},
					],
				},
				{
					label: 'Financeiro',
					items: [
						{
							title: 'Fluxo de Caixa',
							pathname: '/finance/cash-flow',
							icon: LandmarkIcon,
							disabled: true,
						},
						{
							title: 'Receitas e Despesas',
							pathname: '/finance/revenues-and-expenses',
							icon: BanknoteArrowUpIcon,
							disabled: true,
						},
						{
							title: 'A Pagar e A Receber',
							pathname: '/finance/revenues-and-expenses',
							icon: BanknoteArrowUpIcon,
							disabled: true,
						},
						{
							title: 'Inadimplência',
							pathname: '/finance/commissions',
							icon: HandCoinsIcon,
							disabled: true,
						},
						{
							title: 'Folha de Pagamento',
							pathname: '/finance/commissions',
							icon: HandCoinsIcon,
							disabled: true,
						},
						{
							title: 'Notas Fiscais',
							pathname: '/finance/commissions',
							icon: HandCoinsIcon,
							disabled: true,
						},
					],
				},
				{
					label: 'Controle Interno',
					items: [
						{
							title: 'Usuários',
							pathname: '/finance',
							icon: LandmarkIcon,
							disabled: true,
						},
					],
				},
			]
		: [
				{
					label: 'Visão Geral',
					items: [
						{
							title: 'Dashboard',
							pathname: '/dashboard',
							icon: LayoutDashboardIcon,
						},
						{
							title: 'Relatórios',
							pathname: '/performance',
							icon: GaugeIcon,
						},
					],
				},
				{
					label: 'Operacional',
					items: [
						{
							title: 'Gestão de Leads',
							pathname: '/leads',
							icon: FileUserIcon,
							disabled: true,
						},
						{
							title: 'Cotações',
							pathname: '/quotes',
							icon: FileTextIcon,
						},
						{
							title: 'Propostas',
							pathname: '/proposals',
							icon: FileJsonIcon,
						},
						{
							title: 'Apólices',
							pathname: '/policies',
							icon: FileChartColumnIcon,
						},
						{
							title: 'Sinistros',
							pathname: '/accidents',
							icon: FileXIcon,
							disabled: true,
						},
					],
				},
				{
					label: 'Comercial',
					items: [
						{
							title: 'Segurados',
							pathname: '/insureds',
							icon: UsersRoundIcon,
							disabled: true,
						},
						{
							title: 'Seguradoras',
							pathname: '/insurance-companies',
							icon: Building2Icon,
						},
						{
							title: 'Produtores',
							pathname: '/producers',
							icon: UserStarIcon,
						},
					],
				},
				{
					label: 'Financeiro',
					items: [
						{
							title: 'Fluxo de Caixa',
							pathname: '/finance/cash-flow',
							icon: LandmarkIcon,
						},
						{
							title: 'Receitas e A Receber',
							pathname: '/finance/revenues-and-to-receive',
							icon: BanknoteArrowUpIcon,
							disabled: true,
						},
						{
							title: 'Despesas e A Pagar',
							pathname: '/finance/expenses-and-payable',
							icon: BanknoteArrowUpIcon,
							disabled: true,
						},
						{
							title: 'Comissões',
							pathname: '/finance/commissions',
							icon: HandCoinsIcon,
							disabled: true,
						},
						{
							title: 'Inadimplência',
							pathname: '/finance/commissions',
							icon: HandCoinsIcon,
							disabled: true,
						},
						{
							title: 'Folha de Pagamento',
							pathname: '/finance/commissions',
							icon: HandCoinsIcon,
							disabled: true,
						},
						{
							title: 'Notas Fiscais',
							pathname: '/finance/commissions',
							icon: HandCoinsIcon,
							disabled: true,
						},
					],
				},
				{
					label: 'Controle Interno',
					items: [
						{
							title: 'Usuários',
							pathname: '/configurations/users',
							icon: Users2Icon,
							disabled: true,
						},
					],
				},
			];

export { sidebar };
