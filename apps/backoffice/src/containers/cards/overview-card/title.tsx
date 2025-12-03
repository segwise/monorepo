'use client';

import { use } from 'react';
import { CardTitle as Title } from '@/components/ui/card';
import { getSessionCache } from '@/functions/auth/get-session-cache';

function CardTitle() {
	const profile = use(getSessionCache());

	return (
		<Title className='text-2xl'>Seja bem-vindo, {profile?.user.name}</Title>
	);
}

export { CardTitle };
