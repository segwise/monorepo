import {
	BanknoteArrowDownIcon,
	BanknoteArrowUpIcon,
	BriefcaseBusinessIcon,
	Building2Icon,
	FileChartColumnIcon,
	FileJsonIcon,
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
		disabled?: boolean;
	}>;
}> = [
	{
		label: 'Visão Geral',
		items: [
			{
				title: 'Dashboard',
				pathname: '/dashboard',
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
				disabled: true,
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
			},
			{
				title: 'Corretoras',
				pathname: '/brokers',
				icon: BriefcaseBusinessIcon,
				disabled: true,
			},
			{
				title: 'Seguradoras',
				pathname: '/insurance-company',
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
				disabled: true,
			},
			{
				title: 'Receitas',
				pathname: '/finance/revenues',
				icon: BanknoteArrowUpIcon,
				disabled: true,
			},
			{
				title: 'Despesas',
				pathname: '/finance/expenses',
				icon: BanknoteArrowDownIcon,
				disabled: true,
			},
			{
				title: 'Comissões',
				pathname: '/finance/commissions',
				icon: HandCoinsIcon,
				disabled: true,
			},
		],
	},
];

export { sidebar };
