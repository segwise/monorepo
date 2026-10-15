type InsuranceCompany = {
	id: string;
	name: string;
	icon: string;
	cnpj: string;
	contacts: Array<{
		index: number;
		label: string;
		contacts: Array<{
			index: number;
			value: string;
			isWhatsapp?: boolean | null;
			coverage: 'all_regions' | 'capitals_and_metropolitan_regions';
		}>;
	}>;
};

export type { InsuranceCompany };
