import type z from 'zod';
import type {
	SchemaProducerPublicRegister,
	SchemaProducerRegister,
	SchemaProducerRegisterInternal,
} from '../../schemas/producers';

type ProducerRegister = z.infer<typeof SchemaProducerRegister>;
type ProducerPublicRegister = z.infer<typeof SchemaProducerPublicRegister>;
type ProducerRegisterInternal = z.infer<typeof SchemaProducerRegisterInternal>;

export type {
	ProducerRegister,
	ProducerPublicRegister,
	ProducerRegisterInternal,
};
