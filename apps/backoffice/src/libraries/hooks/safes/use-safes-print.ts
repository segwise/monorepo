import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toDayRangeParam } from '@/functions/date/day-range';
import { api } from '@/libraries/api';
import type { SearchParamsProps } from '@/libraries/search-params/safes';

const useSafesPrintById = (id?: string) =>
	useMutation<Blob, Error, string | undefined>({
		mutationKey: ['safes', id, 'print'],
		mutationFn: async (props) =>
			(
				await api.get(`/safes/${props || id}/print`, {
					responseType: 'blob',
				})
			).data,
		onSuccess(data) {
			const urlBlob = URL.createObjectURL(data);

			window.open(urlBlob, '_blank');
		},
		onError(error) {
			toast.error(error.message.toUpperCase());
		},
	});

type SafesPrintListProps = Omit<
	SearchParamsProps,
	'cursor' | 'limit' | 'basisOfAnalysis'
>;

const useSafesPrintList = () =>
	useMutation<Blob, Error, SafesPrintListProps>({
		mutationKey: ['safes', 'print', 'list'],
		mutationFn: async (props) =>
			(
				await api.get('/safes/print', {
					params: {
						...props,
						effectivedAt: toDayRangeParam(props.effectivedAt),
						isExternal: false,
					},
					responseType: 'blob',
				})
			).data,
		onSuccess(data) {
			const urlBlob = URL.createObjectURL(data);

			window.open(urlBlob, '_blank');
		},
		onError(error) {
			toast.error(error.message.toUpperCase());
		},
	});

export { useSafesPrintById, useSafesPrintList };
