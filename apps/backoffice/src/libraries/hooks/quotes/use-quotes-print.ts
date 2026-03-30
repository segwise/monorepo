import { useMutation } from '@tanstack/react-query';
import { api } from '@/libraries/api';

const useQuotesPrintById = (id?: string) =>
	useMutation<Blob, Error, string | undefined>({
		mutationKey: ['quotes', id, 'print'],
		mutationFn: async (props) =>
			(
				await api.get(`/quotes/${props || id}/print`, {
					responseType: 'blob',
				})
			).data,
		onSuccess(data) {
			const urlBlob = URL.createObjectURL(data);

			window.open(urlBlob, '_blank');
		},
	});

export { useQuotesPrintById };
