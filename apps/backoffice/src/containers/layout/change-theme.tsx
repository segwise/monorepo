'use client';

import { MoonIcon, SunIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

function ChangeTheme() {
	const { theme, setTheme } = useTheme();

	function handler() {
		setTheme(theme === 'light' ? 'dark' : 'light');
	}

	return (
		<Button size='icon' variant='outline' onClick={handler} className='size-8'>
			<SunIcon className='rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
			<MoonIcon className='absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
		</Button>
	);
}

export { ChangeTheme };
