'use client';

import { CardTitle as Title } from '@/components/ui/card';
import { useSession } from '@/hooks/auth/use-session';

function CardTitle() {
	const { data: profile } = useSession();

	console.log(profile);
	return <Title className='text-2xl'>Seja bem-vindo, {}</Title>;
}

export { CardTitle };
