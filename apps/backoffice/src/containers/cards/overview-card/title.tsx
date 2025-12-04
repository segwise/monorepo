'use client';

import { CardTitle as Title } from '@/components/ui/card';
import { auth } from '@/libraries/auth';

function CardTitle() {
	const { data: profile } = auth.useSession();

	return (
		<Title className='text-2xl'>Seja bem-vindo, {profile?.user.name}</Title>
	);
}

export { CardTitle };
