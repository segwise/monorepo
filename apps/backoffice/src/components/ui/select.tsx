import {
	Content,
	Group,
	Icon,
	Item,
	ItemIndicator,
	ItemText,
	Label,
	Portal,
	Root,
	ScrollDownButton,
	ScrollUpButton,
	Separator,
	Trigger,
	Value,
	Viewport,
} from '@radix-ui/react-select';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/utils';

const Select = Root;

const SelectGroup = Group;

const SelectValue = Value;

const SelectTrigger = forwardRef<
	React.ComponentRef<typeof Trigger>,
	React.ComponentPropsWithoutRef<typeof Trigger>
>(({ className, children, ...props }, ref) => (
	<Trigger
		ref={ref}
		className={cn(
			'flex h-10 w-full items-center justify-between rounded-sm border border-input bg-background px-3 py-2 text-sm ring-offset-background data-placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1',
			className,
		)}
		{...props}
	>
		{children}
		<Icon asChild>
			<ChevronDownIcon className='size-4 opacity-50 ml-2' />
		</Icon>
	</Trigger>
));
SelectTrigger.displayName = Trigger.displayName;

const SelectScrollUpButton = forwardRef<
	React.ComponentRef<typeof ScrollUpButton>,
	React.ComponentPropsWithoutRef<typeof ScrollUpButton>
>(({ className, ...props }, ref) => (
	<ScrollUpButton
		ref={ref}
		className={cn(
			'flex cursor-default items-center justify-center py-1',
			className,
		)}
		{...props}
	>
		<ChevronUpIcon className='size' />
	</ScrollUpButton>
));
SelectScrollUpButton.displayName = ScrollUpButton.displayName;

const SelectScrollDownButton = forwardRef<
	React.ComponentRef<typeof ScrollDownButton>,
	React.ComponentPropsWithoutRef<typeof ScrollDownButton>
>(({ className, ...props }, ref) => (
	<ScrollDownButton
		ref={ref}
		className={cn(
			'flex cursor-default items-center justify-center py-1',
			className,
		)}
		{...props}
	>
		<ChevronDownIcon className='size' />
	</ScrollDownButton>
));
SelectScrollDownButton.displayName = ScrollDownButton.displayName;

const SelectContent = forwardRef<
	React.ComponentRef<typeof Content>,
	React.ComponentPropsWithoutRef<typeof Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
	<Portal>
		<Content
			ref={ref}
			className={cn(
				'relative z-50 max-h-[--radix-select-content-available-height] min-w-32 overflow-y-auto overflow-x-hidden rounded-sm border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]',
				position === 'popper' &&
					'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
				className,
			)}
			position={position}
			{...props}
		>
			<SelectScrollUpButton />
			<Viewport
				className={cn(
					'p-1',
					position === 'popper' &&
						'h-(--radix-select-trigger-height) w-full min-w-(--radix-select-trigger-width)',
				)}
			>
				{children}
			</Viewport>
			<SelectScrollDownButton />
		</Content>
	</Portal>
));
SelectContent.displayName = Content.displayName;

const SelectLabel = forwardRef<
	React.ComponentRef<typeof Label>,
	React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
	<Label
		ref={ref}
		className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
		{...props}
	/>
));
SelectLabel.displayName = Label.displayName;

const SelectItem = forwardRef<
	React.ComponentRef<typeof Item>,
	React.ComponentPropsWithoutRef<typeof Item>
>(({ className, children, ...props }, ref) => (
	<Item
		ref={ref}
		className={cn(
			'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
			className,
		)}
		{...props}
	>
		<span className='absolute left-2 flex size-3.5 items-center justify-center'>
			<ItemIndicator>
				<CheckIcon className='size-4' />
			</ItemIndicator>
		</span>

		<ItemText>{children}</ItemText>
	</Item>
));
SelectItem.displayName = Item.displayName;

const SelectSeparator = forwardRef<
	React.ComponentRef<typeof Separator>,
	React.ComponentPropsWithoutRef<typeof Separator>
>(({ className, ...props }, ref) => (
	<Separator
		ref={ref}
		className={cn('-mx-1 my-1 h-px bg-muted', className)}
		{...props}
	/>
));
SelectSeparator.displayName = Separator.displayName;

export {
	Select,
	SelectGroup,
	SelectValue,
	SelectTrigger,
	SelectContent,
	SelectLabel,
	SelectItem,
	SelectSeparator,
	SelectScrollUpButton,
	SelectScrollDownButton,
};
