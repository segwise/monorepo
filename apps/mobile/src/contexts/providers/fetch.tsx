import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
	defaultOptions: {
		mutations: {
			networkMode: 'always',
		},
		queries: {
			networkMode: 'always',
		},
	},
});

function FetchProvider({ children }: React.PropsWithChildren) {
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

export { FetchProvider };
