import type z from 'zod';
import type {
	SchemaProducerPublicRegister,
	SchemaProducerRegister,
} from '../../schemas/producers';

type ProducerRegister = z.infer<typeof SchemaProducerRegister>;
type ProducerPublicRegister = z.infer<typeof SchemaProducerPublicRegister>;

export type { ProducerRegister, ProducerPublicRegister };
