import type { PaymentStatus } from '../../types/payments';

function translatePaymentStatus(status: PaymentStatus) {
	switch (status) {
		case 'paid':
			return 'Pago';
		case 'waiting':
			return 'Aguardando';
		case 'expired':
			return 'Expirado';
		case 'canceled':
			return 'Cancelado';
		default:
			return status;
	}
}

export { translatePaymentStatus };
