import '@/styles';

import { TopLoader } from '@/components/top-loader';
import { Toaster } from '@/components/ui/sonner';
import { Layout } from '@/containers/layout';
import { inter } from '@/fonts/inter';
// import { Providers } from '@/providers/contexts';
import { cn } from '@/utils';

function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='pt-BR' suppressHydrationWarning>
			<body
				className={cn(
					'bg-sidebar overflow-hidden',
					inter.variable,
					inter.className,
				)}
			>
				<TopLoader />
				{/* <Providers> */}
				<Layout>{children}</Layout>
				{/* </Providers> */}
				<Toaster />
			</body>
		</html>
	);
}

export default RootLayout;
