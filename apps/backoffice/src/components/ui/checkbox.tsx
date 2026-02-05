import { Indicator, Root } from '@radix-ui/react-checkbox';
import { CheckIcon } from 'lucide-react';
import { forwardRef } from 'react';
import { cn } from '@/utils';

const Checkbox = forwardRef<
	React.ComponentRef<typeof Root>,
	React.ComponentPropsWithoutRef<typeof Root>
>(({ className, ...props }, ref) => (
	<div>
		<Root
			ref={ref}
			className={cn(
				'grid place-content-center cursor-pointer peer size-4 shrink-0 rounded border border-input ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-0',
				'mb-0',
				className,
			)}
			{...props}
		>
			<Indicator className='grid place-content-center text-current'>
				<CheckIcon className='size-4' />
			</Indicator>
		</Root>
	</div>
));
Checkbox.displayName = Root.displayName;

export { Checkbox };
