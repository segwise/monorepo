import { cn } from '@/libraries/classname';
import {
	Platform,
	Text,
	TextInput,
	type TextInputProps,
	View,
} from 'react-native';
import { Label } from './label';

function Input({
	className,
	label,
	...props
}: TextInputProps &
	React.RefAttributes<TextInput> & {
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
			<TextInput
				className={cn(
					'dark:bg-input/30 border-input bg-background text-foreground flex h-12 w-full min-w-0 flex-row items-center rounded-sm border px-4 py-1 text-base leading-5 sm:h-9',
					props.editable === false &&
						cn(
							'opacity-50',
							Platform.select({
								web: 'disabled:pointer-events-none disabled:cursor-not-allowed',
							}),
						),
					Platform.select({
						web: cn(
							'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm',
							'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
							'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
						),
						native:
							'placeholder:text-muted-foreground/40 placeholder:text-base placeholder:leading-tight placeholder:font-semibold',
					}),
					className,
				)}
				{...props}
			/>
		</View>
	);
}

function InputError({ children }: { children: string }) {
	return (
		<Text
			allowFontScaling={false}
			className='mt-1 text-destructive font-semibold text-sm leading-tight'
		>
			{children}
		</Text>
	);
}

export { Input, InputError };
