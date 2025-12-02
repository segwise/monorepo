import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/utils';

const badgeVariants = cva(
	'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:size-4 gap-x-1',
	{
		variants: {
			variant: {
				default:
					'border-primary bg-primary/10 text-primary hover:bg-primary/20',
				outline: 'text-foreground',
				secondary:
					'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
				destructive:
					'border-red-600 bg-red-500/10 text-red-600 hover:bg-red-500/20',
				success:
					'border-green-600 bg-green-500/10 text-green-600 hover:bg-green-500/20',
				warning:
					'border-yellow-600 bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20',
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
