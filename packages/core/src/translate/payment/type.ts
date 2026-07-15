import type { PaymentType } from '../../types/payments';

function translatePaymentType(status: PaymentType) {
	switch (status) {
		case 'revenue':
			return 'Receita';
		case 'expense':
			return 'Despesa';
		default:
			return status;
	}
}

export { translatePaymentType };
