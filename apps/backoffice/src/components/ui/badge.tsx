import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils';

const badgeVariants = cva(
	'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:size-4 gap-x-1',
	{
		variants: {
			variant: {
				default:
					'border-foreground/30 bg-foreground/5 text-foreground hover:bg-foreground/10',
				outline: 'bg-transparent text-foreground hover:bg-transparent',
				secondary:
					'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
				destructive:
					'border-red-500/40 bg-red-500/5 text-red-500 hover:bg-red-500/10',
				success:
					'border-green-500/40 bg-green-500/5 text-green-500 hover:bg-green-500/10',
				warning:
					'border-yellow-500/40 bg-yellow-500/5 text-yellow-500 hover:bg-yellow-500/10',
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
		<div className={cn(badgeVariants({ variant }), className)} {...props} />
	);
}

export { Badge, badgeVariants };
