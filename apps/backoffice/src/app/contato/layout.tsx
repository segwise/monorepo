import '@/styles';

import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { inter } from '@/fonts/inter';
import { cn } from '@/utils';

export const metadata: Metadata = {
	title: {
		default: 'Segwise',
		template: '%s - Segwise',
	},
};

function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='pt-BR' suppressHydrationWarning>
			<body
				className={cn(
					'bg-sidebar overflow-hidden overscroll-none',
					inter.variable,
					inter.className,
				)}
			>
				{children}
				<Toaster />
			</body>
		</html>
	);
}

export default RootLayout;
