import type z from 'zod';
import type { SchemaProducerSimple } from '../schemas';

type ProducerSimple = z.infer<typeof SchemaProducerSimple>;

export type { ProducerSimple };
