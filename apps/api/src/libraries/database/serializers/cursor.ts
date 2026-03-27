import type { ResponseDataCursor } from '@segwise/core/types';

function serializerCursor<T = unknown, K = unknown>(
	data: T[],
	props: {
		total: number;
		previous?: string | null;
		next?: string | null;
		pages?: Record<
			number | 'first' | 'last' | 'count',
			string | number | null
		> | null;
	},
	additional?: K,
): ResponseDataCursor<T> {
	// @ts-expect-error
	return {
		data,
		total: props.total,
		...(!!props?.previous && {
			previous: props.previous,
		}),
		...(!!props?.next && {
			next: props.next,
		}),
		...(!!props?.pages && {
			pages: props.pages,
		}),
		...(!!additional && {
			additional,
		}),
	};
}

export { serializerCursor };
