import { cn } from '@/libraries/classname';
import { openURL } from 'expo-linking';
import { type Href, useRouter } from 'expo-router';
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
	title: string;
	invert?: boolean;
	icon: (props: {
		width?: number;
		height?: number;
		className?: string;
		style?: StyleProp<ViewStyle>;
	}) => React.ReactElement;
} & ButtonGridVariant;

function ButtonGrid({
	title,
	invert = false,
	icon: Icon,
	href,
	onPress,
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
		<TouchableOpacity
			onPress={navigation}
			className={cn(
				'w-full h-40 rounded-md border flex flex-col items-center justify-between p-3',
				invert && 'border-0 bg-primary',
				width <= 400 && 'h-32',
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
			<View className='h-9 flex flex-row items-center'>
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
	);
}

export { ButtonGrid };
