import { cn } from '@/libraries/classname';
import { useEffect, useRef, useState } from 'react';
import { type KeyboardTypeOptions, TextInput, View } from 'react-native';

interface InputOTPProps extends React.ComponentPropsWithoutRef<typeof View> {
	className?: string;
	classNameSquare?: string;
	length?: number;
	value?: string;
	onValueChange?: (value: string) => void;
	autoFocus?: boolean;
	keyboardType?: KeyboardTypeOptions;
}

function InputOTP({
	length = 6,
	value = '',
	onValueChange,
	className,
	classNameSquare,
	autoFocus,
	keyboardType,
	...props
}: InputOTPProps) {
	const refs = useRef<(TextInput | null)[]>([]);

	const [focused, setFocused] = useState(-1);

	const digits = Array.from({ length }, (_, index) => value[index] ?? '');

	const handleChange = (text: string, index: number) => {
		const char = text.slice(-1);

		const next = [...digits];

		next[index] = char;

		onValueChange?.(next.join(''));

		if (char && index < length - 1) {
			refs.current[index + 1]?.focus();
		}
	};

	const handleKeyPress = (key: string, index: number) => {
		if (key === 'Backspace' && !digits[index] && index > 0) {
			refs.current[index - 1]?.focus();
		}
	};

	useEffect(() => {
		if (autoFocus) {
			refs.current[0]?.focus();
		}
	}, [autoFocus]);

	return (
		<View
			className={cn('flex-row gap-2', className)}
			accessibilityRole='none'
			{...props}
		>
			{digits.map((digit, index) => (
				<TextInput
					key={index.toString()}
					ref={(el) => {
						refs.current[index] = el;
					}}
					style={{
						borderRadius: 6,
						borderWidth: focused === index ? 2 : 1,
						borderColor: focused === index ? '#18181b' : '#e4e4e7',
						backgroundColor: '#ffffff',
						textAlign: 'center',
						fontSize: 18,
						fontWeight: '600',
					}}
					className={cn(classNameSquare, 'text-card-foreground')}
					value={digit}
					onChangeText={(t) => handleChange(t, index)}
					onKeyPress={({ nativeEvent }) =>
						handleKeyPress(nativeEvent.key, index)
					}
					onFocus={() => setFocused(index)}
					onBlur={() => setFocused(-1)}
					keyboardType={keyboardType || 'number-pad'}
					maxLength={1}
					selectTextOnFocus
					accessible={true}
					accessibilityLabel={`Digito ${index + 1} de ${length}`}
				/>
			))}
		</View>
	);
}

export { InputOTP };
