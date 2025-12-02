import '@/styles';

import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/containers/layout';
import { inter } from '@/fonts/inter';
import { Providers } from '@/providers/contexts';
import { cn } from '@/utils';

function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='pt-BR'>
			<body className={cn('bg-sidebar', inter.variable, inter.className)}>
				<Providers>
					<Layout>{children}</Layout>
				</Providers>
				<Toaster />
			</body>
		</html>
	);
}

export default RootLayout;
