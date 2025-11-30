import {
	BanknoteArrowDownIcon,
	BanknoteArrowUpIcon,
	BriefcaseBusinessIcon,
	Building2Icon,
	FileChartColumnIcon,
	FileTextIcon,
	FileUserIcon,
	FileXIcon,
	HandCoinsIcon,
	LandmarkIcon,
	LayoutDashboardIcon,
	UsersRoundIcon,
} from 'lucide-react';

const sidebar: Array<{
	label: string;
	items: Array<{
		title: string;
		pathname: string;
		icon: typeof LayoutDashboardIcon;
	}>;
}> = [
	{
		label: 'Visão Geral',
		items: [
			{
				title: 'Dashboard',
				pathname: '/',
				icon: LayoutDashboardIcon,
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
			},
			{
				title: 'Cotações',
				pathname: '/quotes',
				icon: FileTextIcon,
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
			},
			{
				title: 'Corretoras',
				pathname: '/brokers',
				icon: BriefcaseBusinessIcon,
			},
			{
				title: 'Seguradoras',
				pathname: '/insurances',
				icon: Building2Icon,
			},
		],
	},
	{
		label: 'Financeiro',
		items: [
			{
				title: 'Fluxo de Caixa',
				pathname: '/finance',
				icon: LandmarkIcon,
			},
			{
				title: 'Receitas',
				pathname: '/finance/revenues',
				icon: BanknoteArrowUpIcon,
			},
			{
				title: 'Despesas',
				pathname: '/finance/expenses',
				icon: BanknoteArrowDownIcon,
			},
			{
				title: 'Comissões',
				pathname: '/finance/commissions',
				icon: HandCoinsIcon,
			},
		],
	},
];

export { sidebar };
