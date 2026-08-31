import { CardTitle as Title } from '@/components/ui/card';

import { getSessionCache } from '@/functions/auth/get-session-cache';

async function CardTitle() {
	const data = await getSessionCache();

	return <Title className='text-2xl'>Seja bem-vindo, {data.user.name}</Title>;
}

export { CardTitle };
