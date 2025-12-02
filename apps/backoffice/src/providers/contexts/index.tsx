import { ProviderFetch } from './fetch';
import { QueryProvider } from './query';

function Providers({ children }: React.PropsWithChildren) {
	return (
		<QueryProvider>
			<ProviderFetch>{children}</ProviderFetch>
		</QueryProvider>
	);
}

export { Providers };
