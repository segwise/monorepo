import type { QuoteStatus } from '../../types/quotes';

function translateQuoteStatus(status: QuoteStatus) {
	switch (status) {
		case 'waiting':
			return 'Aguardando';
		case 'quoting':
			return 'Cotando';
		case 'quoted':
			return 'Cotado';
		case 'sent':
			return 'Enviado';
		case 'confirmed':
			return 'Confirmado';
		case 'recused':
			return 'Recusado';
		default:
			return status;
	}
}

export { translateQuoteStatus };
