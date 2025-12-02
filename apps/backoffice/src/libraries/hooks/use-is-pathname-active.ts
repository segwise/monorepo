import { usePathname } from 'next/navigation';

function usePathnameIsActive(href?: string): boolean {
	const pathname = usePathname();

	if (!href || href === '') return false;

	// Caso especial: rota raiz "/"
	if (href === '/') {
		return pathname === '/';
	}

	// Remove trailing slash para consistência
	const normalizedHref = href.replace(/\/$/, '');
	const normalizedPathname = pathname.replace(/\/$/, '');

	// Se o href for exatamente igual ao pathname → ativo
	if (normalizedHref === normalizedPathname) return true;

	// Se o pathname COMEÇA com o href seguido de "/", é uma sub-rota → ativo
	// Ex: href="/dashboard" → ativa em "/dashboard/users", "/dashboard/settings", etc.
	return normalizedPathname.startsWith(`${normalizedHref}/`);
}

export { usePathnameIsActive };
