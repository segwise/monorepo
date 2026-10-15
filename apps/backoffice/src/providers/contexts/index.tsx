import { setDefaultOptions } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Fragment } from 'react';
import { ProviderDateFns } from './date-fns';
import { ProviderFetch } from './fetch';
import { QueryProvider } from './query';
import { ThemeProvider } from './theme';

setDefaultOptions({
	locale: ptBR,
});

function Providers({
	noTheme = false,
	children,
}: React.PropsWithChildren<{
	noTheme?: boolean;
}>) {
	const Comp = !noTheme ? ThemeProvider : Fragment;

	return (
		<QueryProvider>
			<ProviderDateFns />
			<ProviderFetch>
				<Comp>{children}</Comp>
			</ProviderFetch>
		</QueryProvider>
	);
}

export { Providers };
