import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils';

const badgeVariants = cva(
	'inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:size-4 gap-x-1',
	{
		variants: {
			variant: {
				default: 'border-foreground/30 bg-foreground/5 text-foreground',
				outline: 'bg-transparent text-foreground',
				secondary: 'border-0 bg-secondary text-secondary-foreground',
				destructive: 'border-0 bg-destructive text-white',
				success: 'border-0 bg-green-500 text-white',
				warning: 'border-0 bg-yellow-500 text-white',
				active: 'border-0 bg-active text-white',
			},
		},
		defaultVariants: {
			variant: 'default',
		},
	},
);

export interface BadgeProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
	return (
		<div
			data-variant={variant}
			className={cn(badgeVariants({ variant }), className)}
			{...props}
		/>
	);
}

export { Badge, badgeVariants };
