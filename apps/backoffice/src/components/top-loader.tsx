import NextTopLoader from 'nextjs-toploader';

function TopLoader() {
	return (
		<NextTopLoader
			color='var(--active)'
			initialPosition={0.08}
			crawlSpeed={200}
			height={3}
			crawl={true}
			showSpinner={false}
			easing='ease'
			speed={200}
			zIndex={1600}
			showAtBottom={false}
		/>
	);
}

export { TopLoader };
