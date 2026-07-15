import type z from 'zod';
import type { SchemaProducerRegister } from '../../schemas/producers';

type ProducerRegister = z.infer<typeof SchemaProducerRegister>;

export type { ProducerRegister };
