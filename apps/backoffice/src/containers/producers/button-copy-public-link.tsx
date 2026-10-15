'use client';

import { LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useProducersPublicLink } from '@/libraries/hooks/producers/use-producers-public-link';

function ButtonCopyProducerPublicLink() {
	const { data, isFetching, isError } = useProducersPublicLink();

	async function copyLink() {
		if (!data?.url) {
			return;
		}

		try {
			await navigator.clipboard.writeText(data.url);

			toast.success('LINK DE CADASTRO COPIADO');
		} catch {
			toast.error('FALHA AO COPIAR LINK');
		}
	}

	return (
		<Button
			variant='outline'
			className='dark:bg-primary max-sm:flex-1'
			disabled={isError || !data?.url}
			isPending={isFetching}
			textPending='Carregando'
			onClick={copyLink}
		>
			<LinkIcon /> Link de Parceria
		</Button>
	);
}

export { ButtonCopyProducerPublicLink };
