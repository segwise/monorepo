import type z from 'zod';
import type {
	SchemaProducerInternalUpdate,
	SchemaProducerPartnerUpdate,
	SchemaProducerPublicRegister,
	SchemaProducerRegister,
	SchemaProducerRegisterInternal,
} from '../../schemas/producers';

type ProducerRegister = z.infer<typeof SchemaProducerRegister>;

// Resposta do cadastro de parceiro. NUNCA traz a senha (o painel já a tem no
// estado do formulário e a mostra uma única vez).
type ProducerRegisterResponse = {
	message: string;
	// Tela de login do portal do parceiro, para o texto enviado pelo WhatsApp.
	accessUrl: string;
	// false quando o usuário já existia com senha própria: ela não foi alterada.
	passwordApplied: boolean;
};
type ProducerPublicRegister = z.infer<typeof SchemaProducerPublicRegister>;
type ProducerRegisterInternal = z.infer<typeof SchemaProducerRegisterInternal>;
type ProducerPartnerUpdate = z.infer<typeof SchemaProducerPartnerUpdate>;
type ProducerInternalUpdate = z.infer<typeof SchemaProducerInternalUpdate>;

export type {
	ProducerInternalUpdate,
	ProducerPartnerUpdate,
	ProducerPublicRegister,
	ProducerRegister,
	ProducerRegisterInternal,
	ProducerRegisterResponse,
};
