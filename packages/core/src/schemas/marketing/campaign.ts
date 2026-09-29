import z from 'zod';
import { SchemaPhone } from '../utils';

const SchemaMarketingTemplate = z.enum(
	['partnership_accounting', 'partnership_condominium'],
	'Modelo de e-mail inválido',
);

const SchemaMarketingFrequency = z.enum(
	['daily', 'monthly'],
	'Frequência inválida',
);

const SchemaMarketingCampaign = z
	.object({
		name: z
			.string('Nome inválido')
			.trim()
			.min(3, 'Nome deve ter no mínimo 3 caracteres'),
		template: SchemaMarketingTemplate,
		subject: z
			.string('Assunto inválido')
			.trim()
			.min(3, 'Assunto deve ter no mínimo 3 caracteres'),
		whatsappPhone: SchemaPhone,
		whatsappMessage: z.string('Mensagem inválida').trim().nullish(),
		frequency: SchemaMarketingFrequency,
		dayOfMonth: z.coerce
			.number('Dia do mês inválido')
			.min(1, 'Dia do mês inválido')
			.max(28, 'Escolha um dia de 1 a 28')
			.nullish(),
		hour: z.coerce
			.number('Horário inválido')
			.min(0, 'Horário inválido')
			.max(23, 'Horário inválido'),
		active: z.boolean('Status inválido'),
	})
	.refine((values) => values.frequency !== 'monthly' || !!values.dayOfMonth, {
		path: ['dayOfMonth'],
		message: 'Informe o dia do mês do envio',
	});

export {
	SchemaMarketingTemplate,
	SchemaMarketingFrequency,
	SchemaMarketingCampaign,
};
