import { Badge } from '@/components/ui/badge';

function FilterBadge({
	active,
	onClick,
	children,
}: React.PropsWithChildren<{ active: boolean; onClick: () => void }>) {
	return (
		<Badge
			variant={active ? 'active' : 'default'}
			className='w-fit px-2 cursor-pointer hover:bg-muted-foreground/20 data-[variant=active]:hover:bg-active/80'
			onClick={onClick}
		>
			{children}
		</Badge>
	);
}

export { FilterBadge };
