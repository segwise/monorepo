import type { MarketingContact } from '@segwise/core/types';

const STATUS_BADGE = {
	never: {
		label: 'Não enviado',
		className: 'bg-transparent text-muted-foreground',
	},
	sent: { label: 'Enviado', className: 'border-0 bg-slate-500 text-white' },
	delivered: {
		label: 'Entregue',
		className: 'border-0 bg-green-500 text-white',
	},
	opened: { label: 'Aberto', className: 'border-0 bg-blue-500 text-white' },
	clicked: { label: 'Clicado', className: 'border-0 bg-purple-500 text-white' },
	bounced: {
		label: 'Não entregue',
		className: 'border-0 bg-red-500 text-white',
	},
	complained: {
		label: 'Spam',
		className: 'border-0 bg-orange-500 text-white',
	},
	failed: { label: 'Falhou', className: 'border-0 bg-red-700 text-white' },
} as const;

type ContactStatus = keyof typeof STATUS_BADGE;

function statusOf(contact: MarketingContact): ContactStatus {
	if (contact.status === 'bounced' || contact.status === 'complained') {
		return contact.status;
	}

	if (contact.clickedAt) {
		return 'clicked';
	}

	if (contact.openedAt) {
		return 'opened';
	}

	return contact.status;
}

// Rótulo do filtro de data: com "Todos" filtra pelo envio; com um status,
// pela data em que aquele status aconteceu.
const STATUS_DATE_LABEL: Record<ContactStatus | 'all', string> = {
	all: 'Data de envio',
	never: 'Data',
	sent: 'Data de envio',
	delivered: 'Data de entrega',
	opened: 'Data de abertura',
	clicked: 'Data do clique',
	bounced: 'Data do envio (não entregue)',
	complained: 'Data do envio (spam)',
	failed: 'Data do envio (falha)',
};

// Bounce, spam e falha não têm horário próprio salvo: usa o do envio.
function statusDateOf(
	contact: MarketingContact,
	status: ContactStatus | 'all',
): string | null {
	switch (status) {
		case 'delivered':
			return contact.deliveredAt;
		case 'opened':
			return contact.openedAt;
		case 'clicked':
			return contact.clickedAt;
		case 'never':
			return null;
		default:
			return contact.lastSentAt;
	}
}

export {
	STATUS_BADGE,
	STATUS_DATE_LABEL,
	statusDateOf,
	statusOf,
	type ContactStatus,
};
