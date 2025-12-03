import { ProviderFetch } from './fetch';
import { QueryProvider } from './query';
import { ThemeProvider } from './theme';

function Providers({ children }: React.PropsWithChildren) {
	return (
		<QueryProvider>
			<ProviderFetch>
				<ThemeProvider>{children}</ThemeProvider>
			</ProviderFetch>
		</QueryProvider>
	);
}

export { Providers };
