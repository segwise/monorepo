import type z from 'zod';
import type { SchemaResponseDataCursor } from '@/schemas/utils/response-data-cursor';

type ResponseDataCursor = z.infer<typeof SchemaResponseDataCursor>;

export type { ResponseDataCursor };
