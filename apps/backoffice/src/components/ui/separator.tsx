import { Root } from '@radix-ui/react-separator';
import { forwardRef } from 'react';
import { cn } from '@/utils';

const Separator = forwardRef<
	React.ComponentRef<typeof Root>,
	React.ComponentPropsWithoutRef<typeof Root>
>(
	(
		{ className, orientation = 'horizontal', decorative = true, ...props },
		ref,
	) => (
		<Root
			ref={ref}
			decorative={decorative}
			orientation={orientation}
			className={cn(
				'shrink-0 bg-border opacity-50',
				orientation === 'horizontal' ? 'w-full h-px' : 'w-px h-full',
				className,
			)}
			{...props}
		/>
	),
);
Separator.displayName = Root.displayName;

export { Separator };
