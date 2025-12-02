import { SettingsIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Suspense } from 'react';
import { DropdownMenuProfile } from '@/components/dropdown-menu-profile';
import {
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
	SidebarSeparator,
	Sidebar as SidebarUI,
} from '@/components/ui/sidebar';
import { brand } from '@/config/brand';
import { sidebar } from '@/config/sidebar';

function Sidebar() {
	return (
		<SidebarUI side='left' variant='inset' collapsible='icon' className='dark'>
			<SidebarHeader>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							size='lg'
							asChild
							className='cursor-default hover:bg-transparent active:bg-transparent'
						>
							<Link href='/'>
								<Image
									src={brand.logo}
									alt={brand.name}
									priority
									quality={100}
									className='aspect-square size-10 object-contain object-center rounded-md'
								/>
								<div className='grid flex-1 text-left text-sm leading-tight'>
									<span className='truncate font-semibold dark:text-sidebar-foreground'>
										{brand.name}
									</span>
									<span className='truncate text-xs font-normal dark:text-sidebar-ring'>
										{brand.slogan}
									</span>
								</div>
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarHeader>
			<SidebarSeparator />
			<SidebarContent>
				{sidebar.map((section, index) => (
					<div key={section.label}>
						<SidebarGroup>
							<SidebarGroupLabel>{section.label}</SidebarGroupLabel>
							<SidebarGroupContent>
								<SidebarMenu>
									{section.items.map((item) => (
										<SidebarMenuItem key={item.title}>
											<SidebarMenuButton
												asChild
												tooltip={item.title}
												pathname={item.pathname}
											>
												<Link href={item.pathname}>
													<item.icon />
													<span>{item.title}</span>
												</Link>
											</SidebarMenuButton>
										</SidebarMenuItem>
									))}
								</SidebarMenu>
							</SidebarGroupContent>
						</SidebarGroup>
						{index < sidebar.length - 1 && <SidebarSeparator />}
					</div>
				))}
			</SidebarContent>
			<SidebarSeparator />
			<SidebarGroup>
				<SidebarGroupContent>
					<SidebarMenu>
						<SidebarMenuItem>
							<SidebarMenuButton asChild tooltip='Configurações'>
								<Link href='/settings'>
									<SettingsIcon />
									<span>Configurações</span>
								</Link>
							</SidebarMenuButton>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarGroupContent>
			</SidebarGroup>
			<SidebarFooter className='p-0 mx-auto w-full'>
				<SidebarSeparator />
				<SidebarMenu className='w-full mx-auto p-0'>
					<SidebarMenuItem>
						<SidebarMenuButton size='lg' className='w-full mx-auto' asChild>
							<Suspense>
								<DropdownMenuProfile />
							</Suspense>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			<SidebarRail />
		</SidebarUI>
	);
}

export { Sidebar };
