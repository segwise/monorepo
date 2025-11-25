import '@/styles';

import { inter } from '@/fonts/inter';
import { cn } from '@/utils';

function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang='pt-BR'>
			<body className={cn('', inter.variable, inter.className)}>
				{children}
			</body>
		</html>
	);
}

export default RootLayout;
