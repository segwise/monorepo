import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api } from '@/libraries/api';

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

export { useSafesPrintById };
