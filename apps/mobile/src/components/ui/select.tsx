import { NativeOnlyAnimatedView } from '@/components/ui/native-only-animated-view';
import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/libraries/classname';
import * as SelectPrimitive from '@rn-primitives/select';
import { Image } from 'expo-image';
import { SymbolView } from 'expo-symbols';
import * as React from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { FadeIn, FadeOut } from 'react-native-reanimated';
import { FullWindowOverlay as RNFullWindowOverlay } from 'react-native-screens';
import { Label } from './label';

type Option = SelectPrimitive.Option;

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

function SelectValue({
	ref,
	className,
	...props
}: SelectPrimitive.ValueProps &
	React.RefAttributes<SelectPrimitive.ValueRef> & {
		className?: string;
	}) {
	const { value } = SelectPrimitive.useRootContext();
	return (
		<SelectPrimitive.Value
			ref={ref}
			className={cn(
				'text-foreground line-clamp-1 flex flex-row items-center gap-2 text-xl leading-tight font-semibold px-1.5',
				!value &&
					'text-muted-foreground/40 text-xl leading-tight font-semibold',
				className,
			)}
			{...props}
		/>
	);
}

function SelectTrigger({
	ref,
	className,
	children,
	label,
	size = 'default',
	...props
}: SelectPrimitive.TriggerProps &
	React.RefAttributes<SelectPrimitive.TriggerRef> & {
		children?: React.ReactNode;
		size?: 'default' | 'sm';
		label?: string;
	}) {
	return (
		<View className='relative'>
			{label && (
				<Label
					classNameRoot='absolute left-4 -top-1.5 z-10 bg-background px-1'
					className='leading-none'
				>
					{label}
				</Label>
			)}
			<SelectPrimitive.Trigger
				ref={ref}
				className={cn(
					'border-input dark:bg-input/30 dark:active:bg-input/50 bg-background flex h-[3.25rem] flex-row items-center justify-between gap-2 rounded-sm border px-3 py-2 shadow-sm shadow-black/5 sm:h-9',
					Platform.select({
						web: 'focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:hover:bg-input/50 w-fit whitespace-nowrap text-sm outline-none transition-[color,box-shadow] focus-visible:ring-[3px] disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0',
					}),
					props.disabled && 'opacity-50',
					size === 'sm' && 'h-8 py-2 sm:py-1.5',
					className,
				)}
				{...props}
			>
				{children}
				<SymbolView
					name={{
						ios: 'chevron.down',
						android: 'chevron_backward',
					}}
					tintColor='#000000'
					size={16}
				/>
			</SelectPrimitive.Trigger>
		</View>
	);
}

const FullWindowOverlay =
	Platform.OS === 'ios' ? RNFullWindowOverlay : React.Fragment;

function SelectContent({
	className,
	children,
	position = 'popper',
	portalHost,
	...props
}: SelectPrimitive.ContentProps &
	React.RefAttributes<SelectPrimitive.ContentRef> & {
		className?: string;
		portalHost?: string;
	}) {
	return (
		<SelectPrimitive.Portal hostName={portalHost}>
			<FullWindowOverlay>
				<SelectPrimitive.Overlay
					style={Platform.select({ native: StyleSheet.absoluteFill })}
					className='bg-black/50'
				>
					<TextClassContext.Provider value='text-popover-foreground'>
						<NativeOnlyAnimatedView
							className='z-50'
							entering={FadeIn.duration(200)}
							exiting={FadeOut.duration(100)}
						>
							<SelectPrimitive.Content
								className={cn(
									'bg-popover border border-border relative z-50 min-w-[8rem] rounded-sm',
									Platform.select({
										web: cn(
											'animate-in fade-in-0 zoom-in-95 origin-(--radix-select-content-transform-origin) max-h-52 overflow-y-auto overflow-x-hidden',
											props.side === 'bottom' && 'slide-in-from-top-2',
											props.side === 'top' && 'slide-in-from-bottom-2',
										),
										native: 'p-1',
									}),
									position === 'popper' &&
										Platform.select({
											web: cn(
												props.side === 'bottom' && 'translate-y-1',
												props.side === 'top' && '-translate-y-1',
											),
										}),
									className,
								)}
								position={position}
								{...props}
							>
								<SelectScrollUpButton />
								<SelectPrimitive.Viewport
									className={cn(
										'p-1',
										position === 'popper' &&
											cn(
												'w-full',
												Platform.select({
													web: 'h-[var(--radix-select-trigger-height)] min-w-[var(--radix-select-trigger-width)]',
												}),
											),
									)}
								>
									{children}
								</SelectPrimitive.Viewport>
								<SelectScrollDownButton />
							</SelectPrimitive.Content>
						</NativeOnlyAnimatedView>
					</TextClassContext.Provider>
				</SelectPrimitive.Overlay>
			</FullWindowOverlay>
		</SelectPrimitive.Portal>
	);
}

function SelectLabel({
	className,
	...props
}: SelectPrimitive.LabelProps & React.RefAttributes<SelectPrimitive.LabelRef>) {
	return (
		<SelectPrimitive.Label
			className={cn(
				'text-muted-foreground px-2 py-2 text-xs sm:py-1.5',
				className,
			)}
			{...props}
		/>
	);
}

function SelectItem({
	className,
	classNameText,
	image,
	children,
	...props
}: SelectPrimitive.ItemProps &
	React.RefAttributes<SelectPrimitive.ItemRef> & {
		classNameText?: string;
		image?: string;
	}) {
	return (
		<SelectPrimitive.Item
			className={cn(
				'active:bg-accent group relative flex w-full flex-row items-center gap-2 rounded-sm py-2 pl-2 pr-8 sm:py-1.5',
				Platform.select({
					web: 'focus:bg-accent focus:text-accent-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2 cursor-default outline-none data-[disabled]:pointer-events-none [&_svg]:pointer-events-none',
				}),
				props.disabled && 'opacity-50',
				className,
			)}
			{...props}
		>
			{!!image && (
				<Image
					source={image}
					contentFit='cover'
					contentPosition='center'
					allowDownscaling={false}
					accessible={false}
					style={{
						width: 24,
						height: 24,
						borderRadius: 3,
					}}
				/>
			)}
			<SelectPrimitive.ItemText
				className={cn(
					'text-foreground group-active:text-accent-foreground select-none text-base font-semibold',
					classNameText,
				)}
			/>
			<View className='absolute right-2 flex size-3.5 items-center justify-center'>
				<SelectPrimitive.ItemIndicator>
					<SymbolView
						name={{
							ios: 'checkmark',
							android: 'check',
						}}
						size={16}
						tintColor='#000000'
						style={{
							flexShrink: 0,
						}}
					/>
				</SelectPrimitive.ItemIndicator>
			</View>
		</SelectPrimitive.Item>
	);
}

function SelectSeparator({
	className,
	...props
}: SelectPrimitive.SeparatorProps &
	React.RefAttributes<SelectPrimitive.SeparatorRef>) {
	return (
		<SelectPrimitive.Separator
			className={cn(
				'bg-border -mx-1 my-1 h-px',
				Platform.select({ web: 'pointer-events-none' }),
				className,
			)}
			{...props}
		/>
	);
}

function SelectScrollUpButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
	if (Platform.OS !== 'web') {
		return null;
	}

	return (
		<SelectPrimitive.ScrollUpButton
			className={cn(
				'flex cursor-default items-center justify-center py-1',
				className,
			)}
			{...props}
		>
			<SymbolView
				name={{
					ios: 'chevron.up',
					android: 'chevron_forward',
				}}
				tintColor='#000000'
				size={16}
			/>
		</SelectPrimitive.ScrollUpButton>
	);
}

function SelectScrollDownButton({
	className,
	...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
	if (Platform.OS !== 'web') {
		return null;
	}
	return (
		<SelectPrimitive.ScrollDownButton
			className={cn(
				'flex cursor-default items-center justify-center py-1',
				className,
			)}
			{...props}
		>
			<SymbolView
				name={{
					ios: 'chevron.down',
					android: 'chevron_backward',
				}}
				tintColor='#000000'
				size={16}
			/>
		</SelectPrimitive.ScrollDownButton>
	);
}

function NativeSelectScrollView({
	className,
	...props
}: React.ComponentProps<typeof ScrollView>) {
	if (Platform.OS === 'web') {
		return <>{props.children}</>;
	}
	return <ScrollView className={cn('max-h-52', className)} {...props} />;
}

export {
	NativeSelectScrollView,
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectScrollDownButton,
	SelectScrollUpButton,
	SelectSeparator,
	SelectTrigger,
	SelectValue,
	type Option,
};
