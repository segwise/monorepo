import type { PaymentMethod } from '../../types/payments';

function translatePaymentMethod(status: PaymentMethod) {
	switch (status) {
		case 'pix':
			return 'Pix';
		case 'credit_card':
			return 'Cartão de Crédito';
		case 'billet':
			return 'Boleto';
		case 'species':
			return 'Espécie';
		case 'transfer':
			return 'Transferência';
		default:
			return status;
	}
}

export { translatePaymentMethod };
