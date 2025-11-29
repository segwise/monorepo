import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
} from '@/components/ui/sidebar';

function AppSidebar({
	side = 'left',
	variant = 'inset',
	collapsible = 'icon',
	...props
}: React.ComponentProps<typeof Sidebar>) {
	return (
		<Sidebar side={side} variant={variant} collapsible={collapsible} {...props}>
			<SidebarHeader />
			<SidebarContent />
			<SidebarFooter />
		</Sidebar>
	);
}

export { AppSidebar };
