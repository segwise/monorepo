'use client';

import type { ThemeProvider as NextThemesProvider } from 'next-themes';

function ThemeProvider({
	children,
	...props
}: React.ComponentProps<typeof NextThemesProvider>) {
	return children;
}

export { ThemeProvider };
