import { CardTitle as Title } from '@/components/ui/card';
import { getSessionCache } from '@/functions/auth/get-session-cache';

async function CardTitle() {
	const profile = await getSessionCache();

	return (
		<Title className='text-2xl'>Seja bem-vindo, {profile?.user.name}</Title>
	);
}

export { CardTitle };
