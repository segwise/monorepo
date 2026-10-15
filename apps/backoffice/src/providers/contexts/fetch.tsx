'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const client = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			refetchOnMount: false,
			refetchOnReconnect: false,
		},
	},
});

function ProviderFetch({ children }: React.PropsWithChildren) {
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

export { ProviderFetch };
