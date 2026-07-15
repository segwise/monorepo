import type {
	ProducerType,
	ProducerTypeOfPayment,
} from '../../types/producers';

function translateProducerType(type: ProducerType) {
	switch (type) {
		case 'gym':
			return 'academia';
		case 'accountants':
			return 'contador';
		case 'driving_school':
			return 'auto escola';
		case 'university':
			return 'faculdade';
		case 'condominium_management':
			return 'administradora de condomínio';
		case 'oil_change':
			return 'troca de óleo';
		case 'youtuber':
			return 'youtuber';
		case 'promoters':
			return 'divulgadores';
		case 'digital_marketing':
			return 'marketing digital';
		case 'buying_group':
			return 'grupo de compras';
		case 'gas_station':
			return 'posto de gasolina';
		case 'restaurant':
			return 'restaurante';
		case 'influencer':
			return 'influencer';
		case 'producer':
			return 'produtor';
		case 'syndicate':
			return 'Sindicato';
		default:
			return type;
	}
}

function translateProducerTypeOfPayment(type: ProducerTypeOfPayment) {
	switch (type) {
		case 'weekly':
			return 'Semanal';
		case 'bi_weekly':
			return 'Quinzenal';
		case 'monthly':
			return 'Mensal';
		default:
			return type;
	}
}

export { translateProducerType, translateProducerTypeOfPayment };
