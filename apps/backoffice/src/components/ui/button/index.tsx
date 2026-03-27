import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type React from 'react';
import { forwardRef } from 'react';
import { cn } from '@/utils';
import { Spinner } from '../spinner';

const buttonVariants = cva(
	'cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
	{
		variants: {
			variant: {
				default: 'bg-primary text-primary-foreground hover:bg-primary/90',
				active: 'bg-active text-foreground hover:bg-active/80',
				destructive:
					'bg-destructive/10 text-destructive hover:bg-destructive/20',
				outline:
					'border border-input text-foreground bg-background hover:bg-accent/50 hover:text-accent-foreground',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-secondary/80',
				ghost: 'hover:bg-muted/50 hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
			},
			size: {
				default: 'h-10 px-4 py-2',
				sm: 'h-9 px-3',
				lg: 'h-12 px-6',
				icon: 'size-10',
				'icon-sm': 'size-9 rounded-sm in-data-[slot=button-group]:rounded-sm',
				'icon-lg': 'size-12',
				'icon-xs':
					"size-6 rounded-sm in-data-[slot=button-group]:rounded-sm [&_svg:not([class*='size-'])]:size-3",
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
);

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
	isPending?: boolean;
	textPending?: string;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
	(
		{
			className,
			variant,
			size,
			asChild = false,
			isPending = false,
			textPending,
			...props
		},
		ref,
	) => {
		const Comp = asChild ? Slot : 'button';

		if (isPending) {
			return (
				<Comp
					className={cn(buttonVariants({ variant, size, className }))}
					ref={ref}
					disabled
					{...props}
				>
					{textPending || 'Carregando'}
					<Spinner />
				</Comp>
			);
		}

		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	},
);
Button.displayName = 'Button';

export { Button, buttonVariants };
