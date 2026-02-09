import type { QuoteStatus } from '@/types/quotes';

function translateQuoteStatus(status: QuoteStatus) {
	if (status === 'waiting') {
		return 'Aguardando';
	}

	if (status === 'quoting') {
		return 'Cotando';
	}

	if (status === 'quoted') {
		return 'Cotado';
	}

	if (status === 'sent') {
		return 'Enviado';
	}

	if (status === 'confirmed') {
		return 'Confirmado';
	}

	if (status === 'recused') {
		return 'Recusado';
	}
}

export { translateQuoteStatus };
