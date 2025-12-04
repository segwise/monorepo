'use client';

import { CardTitle as Title } from '@/components/ui/card';
import { useSession } from '@/hooks/auth/use-session';

function CardTitle() {
	const { data: profile } = useSession();

	return (
		<Title className='text-2xl'>Seja bem-vindo, {profile?.user.name}</Title>
	);
}

export { CardTitle };
