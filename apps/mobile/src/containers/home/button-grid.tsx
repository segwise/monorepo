import { isCompany } from '@/configs/consts/company';
import { cn } from '@/libraries/classname';
import { openURL } from 'expo-linking';
import { type Href, useRouter } from 'expo-router';
import { Fragment } from 'react';
import {
	type StyleProp,
	Text,
	TouchableOpacity,
	useWindowDimensions,
	View,
	type ViewStyle,
} from 'react-native';
import z from 'zod';

type ButtonGridVariant =
	| { href: Href; onPress?: never }
	| { href?: never; onPress: () => void };

type ButtonGridProps = {
	disabled?: boolean;
	title: string;
	invert?: boolean;
	icon: (props: {
		width?: number;
		height?: number;
		className?: string;
		style?: StyleProp<ViewStyle>;
	}) => React.ReactElement;
	borderLight?: boolean;
} & ButtonGridVariant;

function ButtonGrid({
	disabled,
	title,
	invert = false,
	icon: Icon,
	href,
	onPress,
	borderLight,
}: ButtonGridProps) {
	const { width } = useWindowDimensions();

	const { push } = useRouter();

	function navigation() {
		if (onPress) {
			onPress();
		} else if (href) {
			const isUrl = z.url().safeParse(href.toString()).success;

			if (isUrl) {
				openURL(href.toString());

				return;
			}

			push(href);
		}
	}

	return (
		<Fragment>
			{disabled && (
				<View className='absolute top-[1px] bg-destructive rounded-b-sm inset-x-0 px-2 py-0.5 mx-3'>
					<Text
						allowFontScaling={false}
						accessible={false}
						className='text-center text-xs font-medium text-white line-clamp-1'
					>
						Em Construção
					</Text>
				</View>
			)}
			<TouchableOpacity
				disabled={disabled}
				onPress={navigation}
				className={cn(
					'w-full h-40 rounded-md border flex flex-col items-center justify-between p-3',
					invert && cn('border-0 bg-primary', isCompany && 'bg-primary-xcar'),
					width <= 400 && 'h-32',
					disabled && 'opacity-60',
					borderLight && 'border-border',
				)}
			>
				<View />
				<View className='flex flex-row items-center justify-center'>
					<Icon
						style={{
							...(width <= 400 && {
								transform: [{ scale: 0.8 }],
							}),
						}}
					/>
				</View>
				<View className='h-12 flex flex-row items-center'>
					<Text
						allowFontScaling={false}
						className={cn(
							'text-center text-base font-semibold leading-none',
							invert && 'text-white',
							width <= 400 && 'text-sm leading-none',
						)}
					>
						{title}
					</Text>
				</View>
			</TouchableOpacity>
		</Fragment>
	);
}

export { ButtonGrid };
