async function PathnamePage({ params }: PageProps<'/[...pathname]'>) {
	const { pathname } = await params;

	return <span>{pathname.join(' / ')}</span>;
}

export default PathnamePage;
