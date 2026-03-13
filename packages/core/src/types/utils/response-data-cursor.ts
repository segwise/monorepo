import type z from 'zod';
import type { SchemaResponseDataCursor } from '@/schemas/utils/response-data-cursor';

// biome-ignore lint/suspicious/noExplicitAny: Any
type ResponseDataCursor<T = any> = Omit<
	z.infer<typeof SchemaResponseDataCursor>,
	'data'
> & {
	data: T[];
};

export type { ResponseDataCursor };
