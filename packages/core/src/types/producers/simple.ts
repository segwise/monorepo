import type z from 'zod';
import type { SchemaProducerSimple } from '../../schemas/producers/simple';

type ProducerSimple = z.infer<typeof SchemaProducerSimple>;

export type { ProducerSimple };
