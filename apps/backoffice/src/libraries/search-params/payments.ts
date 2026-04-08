import {
	SchemaPaymentMethod,
	SchemaPaymentStatus,
	SchemaPaymentType,
	SchemaSearchParamsPaymentSimple,
} from '@segwise/core/schemas';
import {
	parseAsArrayOf,
	parseAsInteger,
	parseAsJson,
	parseAsString,
	parseAsStringEnum,
	useQueryStates,
} from 'nuqs';

const useSearchParams = () =>
	useQueryStates({
		cursor: parseAsString,
		search: parseAsString,
		payers: parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			clearOnDefault: true,
		}),
		receivers: parseAsArrayOf(parseAsString).withDefault([]).withOptions({
			clearOnDefault: true,
		}),
		limit: parseAsInteger,
		status: parseAsArrayOf(parseAsStringEnum(SchemaPaymentStatus.options))
			.withDefault([])
			.withOptions({
				clearOnDefault: true,
			}),
		expiration: parseAsJson(SchemaSearchParamsPaymentSimple.shape.expiration),
		paidAt: parseAsJson(SchemaSearchParamsPaymentSimple.shape.paidAt),
		type: parseAsArrayOf(parseAsStringEnum(SchemaPaymentType.options))
			.withDefault([])
			.withOptions({
				clearOnDefault: true,
			}),
		method: parseAsArrayOf(parseAsStringEnum(SchemaPaymentMethod.options))
			.withDefault([])
			.withOptions({
				clearOnDefault: true,
			}),
		amount: parseAsJson(SchemaSearchParamsPaymentSimple.shape.amount),
	});

type SearchParamsProps = ReturnType<typeof useSearchParams>[0];

export { useSearchParams, type SearchParamsProps };
