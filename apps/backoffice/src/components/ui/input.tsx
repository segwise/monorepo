import { forwardRef } from 'react';
import { cn } from '@/utils';

const Input = forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
	({ className, type, ...props }, ref) => {
		return (
			<input
				type={type}
				className={cn(
					'flex w-full h-10 rounded-sm border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
					'aria-invalid:ring-destructive/20 aria-invalid:border-destructive dark:aria-invalid:ring-destructive/40',
					className,
				)}
				ref={ref}
				{...props}
			/>
		);
	},
);

Input.displayName = 'Input';

const InputMessage = forwardRef<HTMLSpanElement, React.ComponentProps<'span'>>(
	({ className, children, ...props }, ref) => {
		return (
			<span
				className={cn('text-destructive text-xs', className)}
				ref={ref}
				{...props}
			>
				{children}
			</span>
		);
	},
);

InputMessage.displayName = 'InputMessage';

export { Input, InputMessage };
