import { SettingsIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Activity, Suspense } from 'react';
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
	SidebarSeparator,
	Sidebar as SidebarUI,
} from '@/components/ui/sidebar';
import { brand } from '@/config/brand';
import { sidebar } from '@/config/sidebar';
import { DropdownMenuProfile } from '@/containers/layout/dropdown-menu-profile';

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
									className='aspect-square w-5/6 object-contain object-center'
								/>
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
						<Activity mode={index < sidebar.length - 1 ? 'visible' : 'hidden'}>
							<SidebarSeparator />
						</Activity>
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
								<DropdownMenuProfile variant='sidebar' />
							</Suspense>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</SidebarUI>
	);
}

export { Sidebar };
