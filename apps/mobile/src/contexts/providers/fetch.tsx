import { useFetchSetup } from '@/libraries/hooks/useFetchSetup';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

function FetchProvider({ children }: React.PropsWithChildren) {
	useFetchSetup();

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

export { FetchProvider };
