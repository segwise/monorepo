import type z from 'zod';
import type { SchemaResponseDataCursor } from '../../schemas/utils/response-data-cursor';

// biome-ignore lint/suspicious/noExplicitAny: response
type ResponseDataCursor<T = any> = Omit<
	z.infer<typeof SchemaResponseDataCursor>,
	'data' | 'pages'
> & {
	data: T[];
	pages: Record<number | 'first' | 'last' | 'count', string | null> | null;
};

export type { ResponseDataCursor };
