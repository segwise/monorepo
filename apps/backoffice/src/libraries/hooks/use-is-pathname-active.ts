import { usePathname } from 'next/navigation';

function usePathnameIsActive(href?: string): boolean {
	const pathname = usePathname();

	if (!href || href === '') return false;

	if (href === '/') {
		return pathname === '/';
	}

	const normalizedHref = href.replace(/\/$/, '');
	const normalizedPathname = pathname.replace(/\/$/, '');

	if (normalizedHref === normalizedPathname) return true;

	return normalizedPathname.startsWith(`${normalizedHref}/`);
}

export { usePathnameIsActive };
