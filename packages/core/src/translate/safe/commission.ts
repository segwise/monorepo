import type { SafeCommissionType } from '../../types/safes';

function translateSafeCommissionType(status: SafeCommissionType) {
	switch (status) {
		case 'by_the_brokerage_commission':
			return 'Pela Comissão da Corretora';
		case 'by_the_net_premium':
			return 'Pelo Prêmio Líquido';
		case 'fixed_value':
			return 'Valor Fixo';
		default:
			return status;
	}
}

export { translateSafeCommissionType };
