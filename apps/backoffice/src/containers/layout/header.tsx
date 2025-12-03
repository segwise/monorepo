'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/utils';

function Header({ children }: React.PropsWithChildren) {
	const headerRef = useRef<HTMLElement>(null);

	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const header = headerRef.current;

		if (!header) {
			return;
		}

		const scrollContainer = header.parentElement;

		if (!scrollContainer) {
			return;
		}

		const handleScroll = () => {
			setScrolled(scrollContainer.scrollTop > 10);
		};

		handleScroll();

		scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

		return () => {
			scrollContainer.removeEventListener('scroll', handleScroll);
		};
	}, []);

	return (
		<header
			ref={headerRef}
			className={cn(
				'sticky top-0 left-0 right-0 z-50 px-6 pt-5 pb-3 flex items-center justify-between transition-all ease-out',
				!scrolled &&
					'bg-transparent backdrop-blur-none border border-transparent shadow-none',
				scrolled &&
					'bg-white/40 dark:bg-black/50 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-lg py-3',
			)}
		>
			{children}
		</header>
	);
}

export { Header };
