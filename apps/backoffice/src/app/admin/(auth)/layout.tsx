import '@/styles/globals.css';

import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { inter } from '@/fonts/inter';
import { Providers } from '@/providers/contexts';
import { cn } from '@/utils';

export const metadata: Metadata = {
	title: 'Autenticação - Segwise',
};

function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='pt-BR' suppressHydrationWarning>
			<body className={cn(inter.variable, inter.className)}>
				<Providers noTheme>{children}</Providers>
				<Toaster />
			</body>
		</html>
	);
}

export default RootLayout;
