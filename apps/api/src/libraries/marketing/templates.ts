import type { ReactElement } from 'react';
import type { MarketingTemplate } from '@segwise/database/enums';
import { TemplatePartnershipInviteAccounting } from '../../templates/partnership-invite/accounting';
import { TemplatePartnershipInviteCondominium } from '../../templates/partnership-invite/condominium';

// Novo modelo de e-mail = novo item aqui (+ valor no enum MarketingTemplate).
const marketingTemplates: Record<
	MarketingTemplate,
	{
		label: string;
		defaultSubject: string;
		render: (props: { whatsappUrl: string }) => ReactElement;
	}
> = {
	partnership_accounting: {
		label: 'Parceria - Contabilidade',
		defaultSubject:
			'Parceria comercial - Escritório de Contabilidade e a SEGWISE / XCAR CORRETORA DE SEGUROS',
		render: (props) => TemplatePartnershipInviteAccounting(props),
	},
	partnership_condominium: {
		label: 'Parceria - Administradora de Condomínio',
		defaultSubject:
			'Parceria comercial - Administradora de Condomínios e a SEGWISE / XCAR CORRETORA DE SEGUROS',
		render: (props) => TemplatePartnershipInviteCondominium(props),
	},
};

function buildWhatsappUrl(phone: string, message?: string | null) {
	const digits = phone.replace(/\D/g, '');
	const number = digits.startsWith('55') ? digits : `55${digits}`;
	const url = new URL(`https://wa.me/${number}`);

	if (message) {
		url.searchParams.set('text', message);
	}

	return url.toString();
}

export { marketingTemplates, buildWhatsappUrl };
