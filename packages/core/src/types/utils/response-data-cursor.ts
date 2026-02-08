import type z from 'zod';
import type { SchemaResponseDataCursor } from '../../schemas';

type ResponseDataCursor = z.infer<typeof SchemaResponseDataCursor>;

export type { ResponseDataCursor };
