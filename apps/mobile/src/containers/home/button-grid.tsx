import { cn } from '@/libraries/classname';
import { openURL } from 'expo-linking';
import { type Href, useRouter } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import z from 'zod';

type ButtonGridVariant =
	| { href: Href; onPress?: never }
	| { href?: never; onPress: () => void };

type ButtonGridProps = {
	title: string;
	invert?: boolean;
	icon: React.ReactElement;
} & ButtonGridVariant;

function ButtonGrid({
	title,
	invert = false,
	icon,
	href,
	onPress,
}: ButtonGridProps) {
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
			)}
		>
			<View />
			{icon}
			<View className='h-9 flex flex-row items-center'>
				<Text
					allowFontScaling={false}
					className={cn(
						'text-center text-base font-semibold leading-none',
						invert && 'text-white',
					)}
				>
					{title}
				</Text>
			</View>
		</TouchableOpacity>
	);
}

export { ButtonGrid };
