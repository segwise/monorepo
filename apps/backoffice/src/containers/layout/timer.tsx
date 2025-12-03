'use client';

import { useSyncExternalStore } from 'react';
import { Badge } from '@/components/ui/badge';

const subscribe = (callback: () => void) => {
	const interval = setInterval(callback, 1000);

	return () => clearInterval(interval);
};

const getSnapshot = () => {
	const now = new Date();

	return now.toLocaleTimeString('pt-BR', {
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
};

function Timer() {
	const time = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

	return (
		<Badge variant='outline' className='px-3 py-2' suppressHydrationWarning>
			Horário atual: {time}
		</Badge>
	);
}

export { Timer };
