import { Indicator, Root } from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/utils';

const Checkbox = forwardRef<
	React.ComponentRef<typeof Root>,
	React.ComponentPropsWithoutRef<typeof Root>
>(({ className, ...props }, ref) => (
	<Root
		ref={ref}
		className={cn(
			'grid place-content-center cursor-pointer peer size-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
			'mb-0',
			className,
		)}
		{...props}
	>
		<Indicator className='grid place-content-center text-current'>
			<Check className='size-4' />
		</Indicator>
	</Root>
));
Checkbox.displayName = Root.displayName;

export { Checkbox };
