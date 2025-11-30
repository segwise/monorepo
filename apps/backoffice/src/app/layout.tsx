import '@/styles';

import { Toaster } from '@/components/ui/sonner';
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
			<body className={cn(inter.variable, inter.className)}>
				<Providers>{children}</Providers>
				<Toaster />
			</body>
		</html>
	);
}

export default RootLayout;
