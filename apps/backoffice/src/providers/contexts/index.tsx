import { Fragment } from 'react';
import { ProviderFetch } from './fetch';
import { QueryProvider } from './query';
import { ThemeProvider } from './theme';

function Providers({
	noTheme = false,
	children,
}: React.PropsWithChildren<{
	noTheme?: boolean;
}>) {
	const Comp = !noTheme ? ThemeProvider : Fragment;

	return (
		<QueryProvider>
			<ProviderFetch>
				<Comp>{children}</Comp>
			</ProviderFetch>
		</QueryProvider>
	);
}

export { Providers };
