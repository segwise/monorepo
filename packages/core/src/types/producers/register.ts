import type z from 'zod';
import type {
	SchemaProducerInternalUpdate,
	SchemaProducerPartnerUpdate,
	SchemaProducerPublicRegister,
	SchemaProducerRegister,
	SchemaProducerRegisterInternal,
} from '../../schemas/producers';

type ProducerRegister = z.infer<typeof SchemaProducerRegister>;
type ProducerPublicRegister = z.infer<typeof SchemaProducerPublicRegister>;
type ProducerRegisterInternal = z.infer<typeof SchemaProducerRegisterInternal>;
type ProducerPartnerUpdate = z.infer<typeof SchemaProducerPartnerUpdate>;
type ProducerInternalUpdate = z.infer<typeof SchemaProducerInternalUpdate>;

export type {
	ProducerRegister,
	ProducerPublicRegister,
	ProducerRegisterInternal,
	ProducerPartnerUpdate,
	ProducerInternalUpdate,
};
