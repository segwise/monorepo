import { use } from 'react';

function PathnamePage({ params }: PageProps<'/[...pathname]'>) {
	const { pathname } = use(params);

	return <span>{pathname.join(', ')}</span>;
}

export default PathnamePage;
